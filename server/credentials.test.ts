import { describe, it, expect } from "vitest";

describe("Credenciales de servicios externos", () => {
  it("GOOGLE_CLIENT_ID tiene el formato correcto", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
    expect(clientId).toBeTruthy();
    expect(clientId).toMatch(/\.apps\.googleusercontent\.com$/);
  });

  it("GOOGLE_CLIENT_SECRET tiene el formato correcto", () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
    expect(clientSecret).toBeTruthy();
    expect(clientSecret.startsWith("GOCSPX-")).toBe(true);
  });

  it("CLOUDINARY_CLOUD_NAME está configurado", () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";
    expect(cloudName).toBeTruthy();
    expect(cloudName.length).toBeGreaterThan(0);
  });

  it("CLOUDINARY_API_KEY está configurado", () => {
    const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
    expect(apiKey).toBeTruthy();
    expect(apiKey).toMatch(/^\d+$/); // Solo números
  });

  it("CLOUDINARY_API_SECRET está configurado", () => {
    const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
    expect(apiSecret).toBeTruthy();
    expect(apiSecret.length).toBeGreaterThan(10);
  });

  it("JWT_SECRET está configurado y tiene longitud suficiente", () => {
    const jwtSecret = process.env.JWT_SECRET ?? "";
    expect(jwtSecret).toBeTruthy();
    expect(jwtSecret.length).toBeGreaterThan(8);
  });
});
