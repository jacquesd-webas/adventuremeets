function normalizeMeetQuestionText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function hashFnv1a64(value: string) {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const mask = 0xffffffffffffffffn;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= BigInt(value.charCodeAt(index));
    hash = (hash * prime) & mask;
  }

  return hash.toString(16).padStart(16, "0");
}

export function buildMeetQuestionFieldKey(
  organizationId: string,
  questionLabel: string,
) {
  const normalizedOrganizationId = organizationId.trim().toLowerCase();
  const normalizedQuestionLabel = normalizeMeetQuestionText(questionLabel);
  return `mq_${hashFnv1a64(
    `${normalizedOrganizationId}::${normalizedQuestionLabel}`,
  )}`;
}
