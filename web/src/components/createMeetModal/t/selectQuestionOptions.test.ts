import {
  formatSelectQuestionOptions,
  parseSelectQuestionOptions,
} from "../selectQuestionOptions";

it("preserves commas inside options when formatting saved choices", () => {
  const choices = ["Cape Town, South Africa", "Durban, South Africa"];
  expect(formatSelectQuestionOptions(choices)).toBe(
    "Cape Town, South Africa; Durban, South Africa",
  );
  expect(
    parseSelectQuestionOptions(formatSelectQuestionOptions(choices)),
  ).toEqual(choices);
});
