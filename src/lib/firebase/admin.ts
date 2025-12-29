import admin from "firebase-admin";

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  // Handle newlines in private key
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseAdminConfig as any),
  });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };
