import { Tooltip } from "@mui/material";
import type { ReactNode } from "react";

type LockedTooltipWrapperProps = {
  isReadOnly?: boolean;
  children: ReactNode;
};

export function LockedTooltipWrapper({
  isReadOnly = false,
  children,
}: LockedTooltipWrapperProps) {
  const title = isReadOnly
    ? "Meet is locked because you are not the organizer"
    : "";

  return (
    <Tooltip
      title={title}
      disableHoverListener={!title}
      disableFocusListener={!title}
      disableTouchListener={!title}
    >
      <span>{children}</span>
    </Tooltip>
  );
}
