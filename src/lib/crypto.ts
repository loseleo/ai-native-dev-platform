import crypto from "crypto";

const algorithm = "aes-256-gcm";

function getKey() {
  const key = process.env.APP_ENCRYPTION_KEY;

  if (!key) {
    throw new Error("APP_ENCRYPTION_KEY is required before saving sensitive setup configuration.");
  }

  return crypto.createHash("sha256").update(key).digest();
}

export function hasEncryptionKey() {
  return Boolean(process.env.APP_ENCRYPTION_KEY);
}

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptSecret(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split(".");

  if (!ivValue || !tagValue || !encryptedValue) {
    return value;
  }

  const decipher = crypto.createDecipheriv(algorithm, getKey(), Buffer.from(ivValue, "base64"));
  decipher.setAuthTag(Buffer.from(tagValue, "base64"));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedValue, "base64")), decipher.final()]);

  return decrypted.toString("utf8");
}

export function maskSecret(value?: string | null) {
  if (!value) {
    return "Not configured";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
