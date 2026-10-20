import { useState } from "react";
import { Chip, Menu, MenuItem } from "@mui/material";
import type { QuestionField } from "./CreateMeetState";

type Category = NonNullable<QuestionField["category"]>;

const categoryOptions: { value: Category; label: string }[] = [
  { value: "T", label: "Transport" },
  { value: "M", label: "Medical" },
  { value: "P", label: "PDF" },
  { value: "I", label: "Indemnity" },
  { value: "N", label: "None" },
];

type QuestionCategoryBadgeProps = {
  category?: QuestionField["category"];
  pdfFormFieldId?: string;
  questionLabel: string;
  disabled?: boolean;
  onChange: (category: Category) => void;
};

export function QuestionCategoryBadge({
  category,
  pdfFormFieldId,
  questionLabel,
  disabled = false,
  onChange,
}: QuestionCategoryBadgeProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const selectedCategory = category ?? (pdfFormFieldId ? "P" : "N");
  const categoryLabel = categoryOptions.find(
    (option) => option.value === selectedCategory,
  )?.label;
  const availableOptions = categoryOptions.filter(
    (option) => option.value !== "P" || pdfFormFieldId || category === "P",
  );

  return (
    <>
      <Chip
        label={categoryLabel}
        size="small"
        title={
          disabled
            ? `${categoryLabel} category`
            : `${categoryLabel} category — click to change`
        }
        aria-label={`Category for ${questionLabel || "question"}: ${categoryLabel}`}
        clickable={!disabled}
        onClick={
          disabled ? undefined : (event) => setAnchorEl(event.currentTarget)
        }
        sx={{ height: 24, minWidth: 32, fontSize: 12 }}
      />
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        sx={{ zIndex: 1501 }}
      >
        {availableOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={selectedCategory === option.value}
            onClick={() => {
              onChange(option.value);
              setAnchorEl(null);
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
