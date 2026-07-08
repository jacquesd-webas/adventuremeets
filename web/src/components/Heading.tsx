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
  const showHeadingText = Boolean(title || subtitle);

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      mb={2}
      spacing={2}
    >
      {showHeadingText ? (
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ fontSize: { xs: "1.6rem", sm: "2.125rem" } }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      ) : null}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ width: showHeadingText ? "auto" : "100%" }}
      >
        {actionComponent ? (
          <Box
            onClick={onAction}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              width: showHeadingText ? "auto" : "100%",
            }}
          >
            {actionComponent}
          </Box>
        ) : null}
        {secondaryActionComponent ? (
          <Box
            onClick={onSecondaryAction}
            sx={{ display: "inline-flex", alignItems: "center" }}
          >
            {secondaryActionComponent}
          </Box>
        ) : null}
      </Stack>
    </Stack>
  );
}
