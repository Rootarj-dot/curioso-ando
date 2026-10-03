#!/usr/bin/env python
"""
Consulta Search Console de curioseandoando.com con una cuenta de servicio.

La clave JSON vive fuera del repo, en %USERPROFILE%\\.secrets\\gsc-curioso.json,
y nunca se imprime ni se versiona. Pásale otra ruta con GSC_KEY si la mueves.

El informe "Indexación > Páginas" no está en la API, pero la API de inspección
de URLs sí dice, una por una, si Google la tiene indexada y cuándo la rastreó;
eso responde a lo mismo con más detalle.

Uso:
    python scripts/search-console.py            # resumen: acceso, sitemaps, rendimiento
    python scripts/search-console.py --indice   # además inspecciona las URLs del sitemap
    python scripts/search-console.py --indice --limite 20
"""
from __future__ import annotations

import argparse
import csv
import os
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

DOMINIO = "curioseandoando.com"
SITEMAP = "https://curioseandoando.com/sitemap.xml"

# La consola de Windows usa cp1252 y revienta con los acentos y los recuadros.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
SCOPES = ["https://www.googleapis.com/auth/webmasters.readonly"]
DEFAULT_KEY = Path(os.environ.get("USERPROFILE", Path.home())) / ".secrets" / "gsc-curioso.json"


def servicio():
    ruta = Path(os.environ.get("GSC_KEY", DEFAULT_KEY))
    if not ruta.exists():
        sys.exit(
            f"No encuentro la clave en {ruta}\n"
            "Descarga el JSON de la cuenta de servicio y guárdalo ahí, "
            "o indica otra ruta con la variable GSC_KEY."
        )
    creds = service_account.Credentials.from_service_account_file(str(ruta), scopes=SCOPES)
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def propiedad(api) -> str:
    """
    Devuelve el identificador de la propiedad tal y como lo espera la API.

    Puede ser de dominio ("sc-domain:ejemplo.com", que cubre http, https y www)
    o de prefijo de URL ("https://ejemplo.com/"). Fijar uno a mano falla contra
    el otro, así que se elige el que haya.
    """
    sitios = api.sites().list().execute().get("siteEntry", [])
    if not sitios:
        sys.exit(
            "La cuenta de servicio no tiene ninguna propiedad asignada.\n"
            "En Search Console > Configuración > Usuarios y permisos, añádela como Propietario."
        )
    print("Propiedades a las que tiene acceso:")
    for s in sitios:
        print(f"  {s['siteUrl']}  ({s.get('permissionLevel')})")

    candidatas = [s["siteUrl"] for s in sitios if DOMINIO in s["siteUrl"]]
    if not candidatas:
        sys.exit(f"\nNinguna de esas propiedades corresponde a {DOMINIO}.")
    # La de dominio gana: cubre www y sin www de una vez.
    elegida = next((c for c in candidatas if c.startswith("sc-domain:")), candidatas[0])
    print(f"\nUsando: {elegida}")
    return elegida


def resumen_sitemaps(api, site: str) -> None:
    print("\n── Sitemaps ──")
    datos = api.sitemaps().list(siteUrl=site).execute().get("sitemap", [])
    if not datos:
        print("  Ninguno enviado.")
        return
    for s in datos:
        enviadas = sum(int(c.get("submitted", 0)) for c in s.get("contents", []))
        print(
            f"  {s['path']}\n"
            f"    URLs declaradas: {enviadas}   errores: {s.get('errors', 0)}   "
            f"avisos: {s.get('warnings', 0)}   último descargado: {s.get('lastDownloaded', '—')[:10]}"
        )


def resumen_rendimiento(api, site: str, dias: int = 28) -> None:
    print(f"\n── Rendimiento, últimos {dias} días ──")
    fin = date.today() - timedelta(days=2)  # Search Console va con ~2 días de retraso
    ini = fin - timedelta(days=dias)
    cuerpo = {"startDate": ini.isoformat(), "endDate": fin.isoformat(), "dimensions": []}
    filas = api.searchanalytics().query(siteUrl=site, body=cuerpo).execute().get("rows", [])
    if not filas:
        print("  Sin datos todavía.")
        return
    r = filas[0]
    print(f"  clics: {r['clicks']}   impresiones: {r['impressions']}   "
          f"posición media: {r['position']:.1f}")

    cuerpo = {**cuerpo, "dimensions": ["page"], "rowLimit": 10}
    paginas = api.searchanalytics().query(siteUrl=site, body=cuerpo).execute().get("rows", [])
    if paginas:
        print(f"\n  Páginas con impresiones: {len(paginas)} (top 10)")
        for p in paginas:
            print(f"    {int(p['impressions']):>5} impr  {int(p['clicks']):>3} clics  {p['keys'][0]}")

    cuerpo = {**cuerpo, "dimensions": ["query"]}
    consultas = api.searchanalytics().query(siteUrl=site, body=cuerpo).execute().get("rows", [])
    if consultas:
        print("\n  Búsquedas por las que te ven (top 10)")
        for c in consultas:
            print(f"    {int(c['impressions']):>5} impr  pos {c['position']:>5.1f}  {c['keys'][0]}")


def urls_del_sitemap() -> list[str]:
    with urllib.request.urlopen(SITEMAP, timeout=30) as r:
        raiz = ET.fromstring(r.read())
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text.strip() for loc in raiz.findall(".//s:loc", ns) if loc.text]


CACHE = Path(__file__).with_name("gsc-indice.csv")


def _ya_inspeccionadas() -> dict[str, tuple[str, str, str]]:
    """Lo guardado en pasadas anteriores, para poder retomar donde se quedó."""
    if not CACHE.exists():
        return {}
    with CACHE.open(encoding="utf-8", newline="") as f:
        return {fila[0]: (fila[1], fila[2], fila[3]) for fila in csv.reader(f) if len(fila) >= 4}


def inspeccionar(api, site: str, limite: int | None) -> None:
    urls = urls_del_sitemap()
    if limite:
        urls = urls[:limite]

    hecho = _ya_inspeccionadas()
    pendientes = [u for u in urls if u not in hecho]

    print(f"\n── Estado de indexación ──")
    print(f"   {len(urls)} URLs en el sitemap · {len(hecho)} ya consultadas · {len(pendientes)} por consultar")
    print("   (la API permite 2000 inspecciones al día; esto gasta una por URL)\n")

    # Se escribe una línea por URL en cuanto llega, de modo que una interrupción
    # no tire el trabajo hecho: la siguiente pasada continúa desde aquí.
    with CACHE.open("a", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        for i, url in enumerate(pendientes, 1):
            cuerpo = {"inspectionUrl": url, "siteUrl": site, "languageCode": "es"}
            try:
                res = api.urlInspection().index().inspect(body=cuerpo).execute()
            except HttpError as e:
                if e.resp.status == 429:
                    print("  Cuota agotada; lo hecho queda guardado.", flush=True)
                    break
                print(f"  error {e.resp.status} en {url}", flush=True)
                continue

            r = res.get("inspectionResult", {}).get("indexStatusResult", {})
            w.writerow([
                url,
                r.get("verdict", "?"),
                r.get("coverageState", "desconocido"),
                (r.get("lastCrawlTime") or "")[:10],
            ])
            f.flush()
            if i % 10 == 0:
                print(f"  ...{i}/{len(pendientes)}", flush=True)
            time.sleep(0.05)

    informe(urls)


def informe(urls: list[str]) -> None:
    datos = _ya_inspeccionadas()
    filas = [(u, *datos[u]) for u in urls if u in datos]
    if not filas:
        print("  Todavía no hay resultados guardados.")
        return

    estados = Counter(f[2] for f in filas)
    indexadas = [f for f in filas if f[1] == "PASS"]
    rastreadas = sorted(f[3] for f in filas if f[3])

    print(f"\n  Consultadas: {len(filas)} de {len(urls)}")
    print(f"  INDEXADAS:   {len(indexadas)}")
    print("\n  Por estado:")
    for estado, n in estados.most_common():
        print(f"    {n:>4}  {estado}")
    if rastreadas:
        print(f"\n  Último rastreo: de {rastreadas[0]} a {rastreadas[-1]}")

    fuera = [f for f in filas if f[1] != "PASS"]
    if fuera:
        print(f"\n  Sin indexar ({len(fuera)}), primeras 15:")
        for f in fuera[:15]:
            print(f"    [{f[2]}] {f[0]}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Consulta Search Console de curioseandoando.com")
    ap.add_argument("--indice", action="store_true", help="inspecciona cada URL del sitemap")
    ap.add_argument("--limite", type=int, help="inspecciona solo las primeras N URLs")
    args = ap.parse_args()

    api = servicio()
    site = propiedad(api)

    resumen_sitemaps(api, site)
    resumen_rendimiento(api, site)
    if args.indice:
        inspeccionar(api, site, args.limite)


if __name__ == "__main__":
    main()
