const tagPalette = [
  { background: "#E8F1FB", text: "#28527A", border: "#C7DDF3" },
  { background: "#E2F3EF", text: "#256C5A", border: "#B5E0D2" },
  { background: "#F0EAFE", text: "#5C4B90", border: "#D9CCF7" },
  { background: "#FCEBF0", text: "#8A455E", border: "#F4CDDA" },
  { background: "#FFF3DB", text: "#835C22", border: "#F2DBA6" },
  { background: "#ECF3E4", text: "#566D3F", border: "#D1E2C0" },
  { background: "#EDF1F5", text: "#4D6072", border: "#D3DEE8" },
  { background: "#FBEDE6", text: "#92573C", border: "#F1D3C3" },
  { background: "#E3F5F8", text: "#276777", border: "#B9E3EB" },
  { background: "#E9F5E9", text: "#3E7048", border: "#C5E5C8" },
  { background: "#E8ECFC", text: "#465A9A", border: "#C9D2F4" },
  { background: "#F8EAF8", text: "#824B83", border: "#EAC9E9" },
  { background: "#FFF0E6", text: "#93603D", border: "#F4D5BE" },
  { background: "#F4F4DF", text: "#6A702E", border: "#E1E4B5" },
  { background: "#E7F0F3", text: "#3F6876", border: "#C3DDE4" },
  { background: "#FBE9E4", text: "#99544A", border: "#F0C9BF" },
] as const;

export function attendeeTagChipColors(tag: string) {
  let hash = 0;
  for (const character of tag.toLowerCase()) {
    hash = (Math.imul(hash, 31) + character.codePointAt(0)!) >>> 0;
  }
  const color = tagPalette[hash % tagPalette.length];
  return {
    bgcolor: color.background,
    color: color.text,
    border: "1px solid",
    borderColor: color.border,
    "&:hover": { bgcolor: color.background },
  };
}
