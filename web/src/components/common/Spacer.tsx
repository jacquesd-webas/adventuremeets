import { Box } from "@mui/material";

type SpacerProps = {
  height: number;
};

export function Spacer({ height }: SpacerProps) {
  return <Box sx={{ height }} />;
}
