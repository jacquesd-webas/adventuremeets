import type Meet from "../../types/MeetModel";

export type SignupQuestion = NonNullable<Meet["metaDefinitions"]>[number];
export type SignupQuestionCategory = NonNullable<SignupQuestion["category"]>;

export type SignupQuestionGroup = {
  key: string;
  category: SignupQuestionCategory;
  questions: SignupQuestion[];
};

export function groupMeetSignupQuestions(
  questions: SignupQuestion[],
): SignupQuestionGroup[] {
  const groups: SignupQuestionGroup[] = [];

  questions.forEach((question, index) => {
    const category = question.category ?? "N";
    const previous = groups[groups.length - 1];
    if (previous?.category === category) {
      previous.questions.push(question);
      return;
    }
    groups.push({
      key: question.id || String(index),
      category,
      questions: [question],
    });
  });

  return groups;
}
