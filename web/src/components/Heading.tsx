import { Box, Stack, Typography } from "@mui/material";
import { ReactNode } from "react";

type HeadingProps = {
  title: string;
  subtitle?: string;
  actionComponent?: ReactNode;
  secondaryActionComponent?: ReactNode;
  onAction?: () => void;
  onSecondaryAction?: () => void;
};

export function Heading({
  title,
  subtitle,
  actionComponent,
  secondaryActionComponent,
  onAction,
  onSecondaryAction,
}: HeadingProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      mb={2}
      spacing={2}
    >
      <Box>
        <Typography variant="h4" fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Stack direction="row" spacing={1} alignItems="center">
        {secondaryActionComponent ? (
          <Box
            onClick={onSecondaryAction}
            sx={{ display: "inline-flex", alignItems: "center" }}
          >
            {secondaryActionComponent}
          </Box>
        ) : null}
        {actionComponent ? (
          <Box
            onClick={onAction}
            sx={{ display: "inline-flex", alignItems: "center" }}
          >
            {actionComponent}
          </Box>
        ) : null}
      </Stack>
    </Stack>
  );
}
