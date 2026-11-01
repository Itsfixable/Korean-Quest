// Room codes for the Jitsi call room. Rooms live on the public meet.jit.si
// server, so the code is the only thing keeping strangers out: it must be
// random (not derived from the booking's date/time) and long enough that it
// can't be guessed.

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 10;

export function sanitizeRoomCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_CODE_LENGTH);
}

export function generateRoomCode(length = ROOM_CODE_LENGTH) {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const b of bytes) code += ROOM_CODE_CHARS[b % ROOM_CODE_CHARS.length];
  return code;
}
