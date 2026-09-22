const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatUtcDateTime(ms: number | null | undefined): string {
  if (ms == null || !ms) return "N/A";
  return dateTimeFormatter.format(new Date(ms));
}
