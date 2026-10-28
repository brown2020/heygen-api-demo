const STORAGE_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function assertSafeStorageId(id: string, label: string): string {
  if (!STORAGE_ID.test(id)) {
    throw new Error(`${label} is invalid`);
  }
  return id;
}
