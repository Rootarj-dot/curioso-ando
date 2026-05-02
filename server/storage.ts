// Este archivo es un stub — el almacenamiento de imágenes se hace via Cloudinary.
// Ver server/cloudinaryStorage.ts para la implementación real.

export async function storagePut(
  _relKey: string,
  _data: Buffer | Uint8Array | string,
  _contentType?: string,
): Promise<{ key: string; url: string }> {
  throw new Error("storagePut no está disponible. Usa uploadToCloudinary() de cloudinaryStorage.ts");
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  return { key: relKey, url: relKey };
}
