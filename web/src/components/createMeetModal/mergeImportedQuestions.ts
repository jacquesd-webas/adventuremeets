import { QuestionField } from "./CreateMeetState";

function normalizeLabel(label?: string) {
  return label?.trim() || "";
}

export function mergeImportedQuestions(
  existingQuestions: QuestionField[],
  importedQuestions: QuestionField[],
) {
  const mergedQuestions = [...existingQuestions];
  const existingIds = new Set(
    existingQuestions.map((question) => question.id).filter(Boolean),
  );
  const existingLabels = new Set(
    existingQuestions
      .map((question) => normalizeLabel(question.label))
      .filter(Boolean),
  );

  importedQuestions.forEach((question) => {
    const normalizedLabel = normalizeLabel(question.label);

    if (existingIds.has(question.id)) {
      return;
    }

    if (normalizedLabel && existingLabels.has(normalizedLabel)) {
      return;
    }

    mergedQuestions.push(question);
    if (question.id) {
      existingIds.add(question.id);
    }
    if (normalizedLabel) {
      existingLabels.add(normalizedLabel);
    }
  });

  return mergedQuestions;
}
