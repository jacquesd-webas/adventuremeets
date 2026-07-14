import { describe, expect, it } from "vitest";
import { mergeImportedQuestions } from "../mergeImportedQuestions";

describe("mergeImportedQuestions", () => {
  it("adds imported questions that do not already exist", () => {
    const merged = mergeImportedQuestions(
      [
        {
          id: "existing-1",
          type: "text",
          label: "Experience level",
        },
      ],
      [
        {
          id: "imported-1",
          type: "select",
          label: "Dietary preference",
          options: ["None", "Vegetarian"],
        },
      ],
    );

    expect(merged).toEqual([
      {
        id: "existing-1",
        type: "text",
        label: "Experience level",
      },
      {
        id: "imported-1",
        type: "select",
        label: "Dietary preference",
        options: ["None", "Vegetarian"],
      },
    ]);
  });

  it("does not add imported questions with a duplicate id or exact same label", () => {
    const merged = mergeImportedQuestions(
      [
        {
          id: "existing-1",
          type: "text",
          label: "Experience level",
        },
        {
          id: "existing-2",
          type: "switch",
          label: "Bring snacks?",
        },
      ],
      [
        {
          id: "existing-1",
          type: "select",
          label: "Something else",
          options: ["A", "B"],
        },
        {
          id: "imported-2",
          type: "checkbox",
          label: "Experience level",
        },
        {
          id: "imported-3",
          type: "text",
          label: "Emergency contact",
        },
      ],
    );

    expect(merged).toEqual([
      {
        id: "existing-1",
        type: "text",
        label: "Experience level",
      },
      {
        id: "existing-2",
        type: "switch",
        label: "Bring snacks?",
      },
      {
        id: "imported-3",
        type: "text",
        label: "Emergency contact",
      },
    ]);
  });
});
