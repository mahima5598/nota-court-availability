// Server-only Chelsea adapter. Keep API credentials in environment variables, never in browser code.
export class ChelseaNotConfiguredError extends Error {}

export async function createChelseaBooking() {
  // Replace with the real Chelsea API call once its endpoint and authentication are available.
  // The call must reserve the court atomically and return Chelsea's booking reference.
  throw new ChelseaNotConfiguredError('Chelsea booking API is not connected.');
}
