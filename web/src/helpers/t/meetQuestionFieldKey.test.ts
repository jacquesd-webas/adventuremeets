import { buildMeetQuestionFieldKey } from "../meetQuestionFieldKey";

describe("buildMeetQuestionFieldKey", () => {
  it("builds a stable key for the same organization and question text", () => {
    expect(
      buildMeetQuestionFieldKey("org-1", "Favourite trail snack"),
    ).toBe(buildMeetQuestionFieldKey("org-1", "Favourite trail snack"));
  });

  it("returns a 64-bit hash key", () => {
    expect(buildMeetQuestionFieldKey("org-1", "Favourite trail snack")).toMatch(
      /^mq_[0-9a-f]{16}$/,
    );
  });

  it("normalizes question text before hashing", () => {
    expect(
      buildMeetQuestionFieldKey("org-1", " Favourite   Trail Snack "),
    ).toBe(buildMeetQuestionFieldKey("org-1", "favourite trail snack"));
  });

  it("changes when the organization changes", () => {
    expect(
      buildMeetQuestionFieldKey("org-1", "Favourite trail snack"),
    ).not.toBe(buildMeetQuestionFieldKey("org-2", "Favourite trail snack"));
  });

  it("changes when the question text changes", () => {
    expect(
      buildMeetQuestionFieldKey("org-1", "Favourite trail snack"),
    ).not.toBe(buildMeetQuestionFieldKey("org-1", "Favourite hiking snack"));
  });
});
