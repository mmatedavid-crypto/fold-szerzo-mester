export function formatHuf(amount: number): string {
  return new Intl.NumberFormat("hu-HU").format(amount) + " Ft";
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric" });
}