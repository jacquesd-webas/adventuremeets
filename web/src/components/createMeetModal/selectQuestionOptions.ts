export function parseSelectQuestionOptions(input: string): string[] {
  const separator = input.includes(";") ? ";" : ",";
  return input
    .split(separator)
    .map((option) => option.trim())
    .filter(Boolean);
}

export function formatSelectQuestionOptions(options?: string[]): string {
  if (!options?.length) return "";
  const separator = options.some((option) => option.includes(","))
    ? "; "
    : ", ";
  return options.join(separator);
}
