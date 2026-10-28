const HEYGEN_ASSET_HOSTS = new Set([
  "files.heygen.ai",
  "files2.heygen.ai",
  "resource.heygen.ai",
  "resource2.heygen.ai",
]);

/** 100 MiB cap for a completed talking-photo download. */
export const MAX_VIDEO_DOWNLOAD_BYTES = 100 * 1024 * 1024;

export function assertSafeHeygenAssetUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid video URL");
  }
  if (url.protocol !== "https:") {
    throw new Error("Video URL must be https");
  }
  if (url.username || url.password) {
    throw new Error("Video URL must not include credentials");
  }
  if (url.port && url.port !== "443") {
    throw new Error("Video URL port is not allowed");
  }
  if (!HEYGEN_ASSET_HOSTS.has(url.hostname)) {
    throw new Error("Video URL host is not allowed");
  }
  return url;
}
