import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

/**
 * ENCRYPTION_KEY is an arbitrary-length secret (e.g. `openssl rand -base64
 * 32`) — hash it to a fixed 32-byte key so any reasonable secret works with
 * AES-256.
 */
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY is not set.");
  }
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a secret (e.g. a user's own Gemini API key) for storage at rest.
 * Output is `iv:authTag:ciphertext`, all base64, so it round-trips safely
 * through a single text column.
 */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(
    ":"
  );
}

export function decryptSecret(encrypted: string): string {
  const [ivB64, authTagB64, ciphertextB64] = encrypted.split(":");
  if (!ivB64 || !authTagB64 || !ciphertextB64) {
    throw new Error("Malformed encrypted value.");
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(authTagB64, "base64"));

  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextB64, "base64")),
    decipher.final(),
  ]);

  return plaintext.toString("utf-8");
}

/** Masks a secret for display, e.g. "AIzaSy••••••••wXyz". */
export function maskSecret(secret: string): string {
  if (secret.length <= 8) return "•".repeat(secret.length);
  return `${secret.slice(0, 6)}${"•".repeat(8)}${secret.slice(-4)}`;
}
