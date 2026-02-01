/**
 * Generate a UUID (v4-like)
 * 
 * Uses crypto.randomUUID if available, otherwise falls back to a timestamp-based random string.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  return `uuid-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}
