import axios from "axios";

function responseMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  const nested = record.error;
  if (nested && typeof nested === "object") {
    const message = (nested as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }
  if (typeof record.message === "string") return record.message;
  return undefined;
}

/** Status and message only. Axios config (including API keys) is omitted. */
export function axiosErrorSummary(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = responseMessage(error.response?.data) || error.message || "request failed";
    return `status=${status ?? "none"} message=${message}`;
  }
  if (error instanceof Error) return error.message;
  return "unknown error";
}
