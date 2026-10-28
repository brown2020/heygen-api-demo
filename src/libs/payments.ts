/** Prefer the Stripe id stored on the document over the Firestore document id. */
export function paymentRecordId(fieldId: unknown, documentId: string): string {
  return typeof fieldId === "string" && fieldId.length > 0 ? fieldId : documentId;
}
