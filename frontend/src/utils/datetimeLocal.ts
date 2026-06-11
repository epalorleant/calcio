/** Format a Date or ISO string for <input type="datetime-local" /> in local time. */
export function toDatetimeLocalValue(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const pad = (part: number) => part.toString().padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

/** Parse a datetime-local input value as local browser time. */
export function fromDatetimeLocalValue(value: string): Date {
  return new Date(value);
}
