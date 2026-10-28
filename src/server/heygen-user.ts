import { getAdminServices } from "@/firebase/firebaseAdmin";

export async function getUserHeygenApiKey(userId: string): Promise<string> {
  const { db } = getAdminServices();
  const snap = await db.collection("users").doc(userId).collection("profile").doc("userData").get();
  const key = snap.get("heygen_api_key");
  if (typeof key !== "string" || !key.trim()) {
    throw new Error("HeyGen API key is not set");
  }
  return key.trim();
}
