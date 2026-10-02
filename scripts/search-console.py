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

SITE = "https://curioseandoando.com/"
SITEMAP = "https://curioseandoando.com/sitemap.xml"
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


def comprobar_acceso(api) -> bool:
    sitios = api.sites().list().execute().get("siteEntry", [])
    if not sitios:
        print("La cuenta de servicio no tiene ninguna propiedad asignada.")
        print("En Search Console > Configuración > Usuarios y permisos, añádela como Propietario.")
        return False
    print("Propiedades a las que tiene acceso:")
    for s in sitios:
        print(f"  {s['siteUrl']}  ({s.get('permissionLevel')})")
    return any(s["siteUrl"] == SITE for s in sitios)


def resumen_sitemaps(api) -> None:
    print("\n── Sitemaps ──")
    datos = api.sitemaps().list(siteUrl=SITE).execute().get("sitemap", [])
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


def resumen_rendimiento(api, dias: int = 28) -> None:
    print(f"\n── Rendimiento, últimos {dias} días ──")
    fin = date.today() - timedelta(days=2)  # Search Console va con ~2 días de retraso
    ini = fin - timedelta(days=dias)
    cuerpo = {"startDate": ini.isoformat(), "endDate": fin.isoformat(), "dimensions": []}
    filas = api.searchanalytics().query(siteUrl=SITE, body=cuerpo).execute().get("rows", [])
    if not filas:
        print("  Sin datos todavía.")
        return
    r = filas[0]
    print(f"  clics: {r['clicks']}   impresiones: {r['impressions']}   "
          f"posición media: {r['position']:.1f}")

    cuerpo = {**cuerpo, "dimensions": ["page"], "rowLimit": 10}
    paginas = api.searchanalytics().query(siteUrl=SITE, body=cuerpo).execute().get("rows", [])
    if paginas:
        print(f"\n  Páginas con impresiones: {len(paginas)} (top 10)")
        for p in paginas:
            print(f"    {int(p['impressions']):>5} impr  {int(p['clicks']):>3} clics  {p['keys'][0]}")

    cuerpo = {**cuerpo, "dimensions": ["query"]}
    consultas = api.searchanalytics().query(siteUrl=SITE, body=cuerpo).execute().get("rows", [])
    if consultas:
        print("\n  Búsquedas por las que te ven (top 10)")
        for c in consultas:
            print(f"    {int(c['impressions']):>5} impr  pos {c['position']:>5.1f}  {c['keys'][0]}")


def urls_del_sitemap() -> list[str]:
    with urllib.request.urlopen(SITEMAP, timeout=30) as r:
        raiz = ET.fromstring(r.read())
    ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [loc.text.strip() for loc in raiz.findall(".//s:loc", ns) if loc.text]


def inspeccionar(api, limite: int | None) -> None:
    urls = urls_del_sitemap()
    if limite:
        urls = urls[:limite]
    print(f"\n── Estado de indexación, {len(urls)} URLs ──")
    print("   (la API permite 2000 inspecciones al día; esto gasta una por URL)\n")

    estados: Counter[str] = Counter()
    sin_indexar: list[tuple[str, str]] = []

    for i, url in enumerate(urls, 1):
        cuerpo = {"inspectionUrl": url, "siteUrl": SITE, "languageCode": "es"}
        try:
            res = api.urlInspection().index().inspect(body=cuerpo).execute()
        except HttpError as e:
            if e.resp.status == 429:
                print("  Cuota agotada; paro aquí.")
                break
            print(f"  error en {url}: {e.resp.status}")
            continue

        r = res.get("inspectionResult", {}).get("indexStatusResult", {})
        estado = r.get("coverageState", "desconocido")
        estados[estado] += 1
        if r.get("verdict") != "PASS":
            sin_indexar.append((estado, url))

        if i % 20 == 0:
            print(f"  ...{i}/{len(urls)}")
        time.sleep(0.12)  # muy por debajo del límite de 600/minuto

    print("\n  Resultado:")
    for estado, n in estados.most_common():
        print(f"    {n:>4}  {estado}")

    indexadas = sum(n for e, n in estados.items() if "indexada" in e.lower() or "Submitted and indexed" in e)
    print(f"\n  INDEXADAS: {indexadas} de {sum(estados.values())}")

    if sin_indexar:
        print(f"\n  Sin indexar ({len(sin_indexar)}), primeras 25:")
        for estado, url in sin_indexar[:25]:
            print(f"    [{estado}] {url}")


def main() -> None:
    ap = argparse.ArgumentParser(description="Consulta Search Console de curioseandoando.com")
    ap.add_argument("--indice", action="store_true", help="inspecciona cada URL del sitemap")
    ap.add_argument("--limite", type=int, help="inspecciona solo las primeras N URLs")
    args = ap.parse_args()

    api = servicio()
    if not comprobar_acceso(api):
        sys.exit(f"\nLa cuenta no tiene acceso a {SITE}. Añádela en Search Console y reintenta.")

    resumen_sitemaps(api)
    resumen_rendimiento(api)
    if args.indice:
        inspeccionar(api, args.limite)


if __name__ == "__main__":
    main()
