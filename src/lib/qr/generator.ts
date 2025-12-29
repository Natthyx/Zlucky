import QRCode from "qrcode";
import { supabaseAdmin } from "../supabase/client";

const BUCKET_NAME = "events";

export async function generateAndUploadQR(
  eventId: string,
  publicUrl: string
): Promise<{ qrCodeUrl: string; storagePath: string }> {
  try {
    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(publicUrl, {
      errorCorrectionLevel: "H",
      type: "png",
      width: 500,
      margin: 2,
    });

    // Upload to Supabase Storage
    const storagePath = `${eventId}/qr-code.png`;
    
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, qrBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage error:", error);
      throw error;
    }

    // Get public URL
    const { data: { publicUrl: qrUrl } } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return {
      qrCodeUrl: qrUrl,
      storagePath,
    };
  } catch (error) {
    console.error("QR Generation/Upload error:", error);
    throw error;
  }
}
