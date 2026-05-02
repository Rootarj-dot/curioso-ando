// Notificaciones al owner — stub para proyecto independiente.
// En producción puedes conectar aquí un servicio de email (SendGrid, Resend, etc.)

export type NotificationPayload = {
  title: string;
  content: string;
};

/**
 * Registra una notificación en el log del servidor.
 * Para producción, reemplaza este stub con un servicio de email real.
 */
export async function notifyOwner(
  payload: NotificationPayload
): Promise<boolean> {
  console.log(`[Notification] ${payload.title}: ${payload.content}`);
  return true;
}
