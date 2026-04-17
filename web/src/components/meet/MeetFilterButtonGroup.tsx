import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { ListPageView } from "../../context/filterContext";

type MeetFilterButtonGroupProps = {
  isMobile: boolean;
  value: ListPageView;
  onChange: (view: ListPageView) => void;
};

export function MeetFilterButtonGroup({
  isMobile,
  value,
  onChange,
}: MeetFilterButtonGroupProps) {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={value}
      onChange={(_event, nextView: ListPageView | null) => {
        if (nextView) onChange(nextView);
      }}
      sx={{
        width: isMobile ? "100%" : "auto",
        display: "flex",
        flexWrap: "wrap",
        "& .MuiToggleButton-root": {
          flex: isMobile ? 1 : "unset",
        },
      }}
    >
      <ToggleButton value="draft">Draft</ToggleButton>
      <ToggleButton value="upcoming">Upcoming</ToggleButton>
      <ToggleButton value="past">Past</ToggleButton>
    </ToggleButtonGroup>
  );
}
