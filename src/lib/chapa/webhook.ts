import crypto from "crypto";

export function verifyChapaSignature(payload: string, signature: string, secretKey: string): boolean {
  if (!signature) return false;
  
  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(payload)
    .digest("hex");
    
  return hash === signature;
}
