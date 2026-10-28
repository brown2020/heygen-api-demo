import type { ProfileType } from "@/zustand/useProfileStore";

/** Fields the signed-in user may write. Credits are server-owned. */
export const CLIENT_PROFILE_WRITE_FIELDS = [
  "email",
  "contactEmail",
  "displayName",
  "photoUrl",
  "emailVerified",
  "heygen_api_key",
  "elevenlabs_api_key",
  "selectedAvatar",
  "selectedTalkingPhoto",
] as const satisfies readonly (keyof ProfileType)[];

export function clientProfileWritePayload(
  partial: Partial<ProfileType>
): Partial<ProfileType> {
  const payload: Partial<ProfileType> = {};
  for (const key of CLIENT_PROFILE_WRITE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(partial, key) && partial[key] !== undefined) {
      payload[key] = partial[key] as never;
    }
  }
  return payload;
}
