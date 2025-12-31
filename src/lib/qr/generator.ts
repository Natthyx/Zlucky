import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { supabaseAdmin } from "../supabase/client";

const BUCKET_NAME = "events";
const LOGO_PATH = path.join(process.cwd(), "public/logo.png");

export async function generateAndUploadQR(
  eventId: string,
  publicUrl: string
): Promise<{ qrCodeUrl: string; storagePath: string }> {
  try {
    // 1. Generate QR code buffer
    const qrBuffer = await QRCode.toBuffer(publicUrl, {
      errorCorrectionLevel: "H", // REQUIRED for logo safety
      type: "png",
      width: 500,
      margin: 2,
    });

    // 2. Load logo
    const logoBuffer = await fs.readFile(LOGO_PATH);

    // 3. Resize logo (20% of QR)
    const qrSize = 500;
    const logoSize = Math.floor(qrSize * 0.22);

    const resizedLogo = await sharp(logoBuffer)
      .resize(logoSize, logoSize)
      .png()
      .toBuffer();

    // 4. Composite logo onto QR center
    const finalQrBuffer = await sharp(qrBuffer)
      .composite([
        {
          input: resizedLogo,
          gravity: "center",
        },
      ])
      .png()
      .toBuffer();

    // 5. Upload to Supabase Storage
    const storagePath = `${eventId}/qr-code.png`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(storagePath, finalQrBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage error:", error);
      throw error;
    }

    // 6. Get public URL
    const {
      data: { publicUrl: qrCodeUrl },
    } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

    return {
      qrCodeUrl,
      storagePath,
    };
  } catch (error) {
    console.error("QR Generation/Upload error:", error);
    throw error;
  }
}
