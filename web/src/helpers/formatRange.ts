function formatRange(start?: string, end?: string) {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  return `${s.toLocaleDateString()} • ${s.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} – ${e.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
export default formatRange;
