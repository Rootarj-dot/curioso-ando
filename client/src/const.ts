export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;

  // En entorno local sin variables de entorno configuradas, devolver placeholder
  if (!oauthPortalUrl || !appId) {
    console.warn(
      "[Auth] VITE_OAUTH_PORTAL_URL o VITE_APP_ID no configurados. " +
      "El login OAuth requiere estas variables en el archivo .env"
    );
    return "#login-not-configured";
  }

  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
