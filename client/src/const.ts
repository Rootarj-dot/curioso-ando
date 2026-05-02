export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// URL de login con Google OAuth 2.0
// El servidor maneja el redirect a Google en /api/auth/google
export const getLoginUrl = () => {
  return "/api/auth/google";
};
