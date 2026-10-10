/**
 * IndexNow: tells Bing (and through it ChatGPT search, Copilot and DuckDuckGo),
 * Yandex and the rest of the protocol's members that a page changed, instead
 * of waiting for them to crawl it again. https://www.indexnow.org
 *
 * The key is public by design: the protocol proves ownership by serving it at
 * /<key>.txt on the same host.
 */

export const INDEXNOW_KEY = "ecf81b06491b4954e703b8594ff17282";

const SITE_HOST = "curioseandoando.com";
const ENDPOINT = "https://api.indexnow.org/indexnow";

/** Fire-and-forget: a failed ping must never break saving a story. */
export function notifyIndexNow(paths: string[]): void {
  if (process.env.NODE_ENV !== "production" || paths.length === 0) return;

  const urlList = paths.map((p) => `https://${SITE_HOST}${p}`);
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  })
    .then((res) => console.log(`[IndexNow] ${res.status} for ${urlList.length} URL(s): ${urlList[0]}`))
    .catch((err) => console.error("[IndexNow] ping failed:", err));
}
