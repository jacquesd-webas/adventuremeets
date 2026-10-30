import { useState, type ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import type { SignupQuestionCategory } from "./groupMeetSignupQuestions";

const categoryLabels: Record<SignupQuestionCategory, string> = {
  T: "Transport",
  M: "Medical",
  I: "Indemnity",
  P: "PDF",
  N: "None",
};

const categoryIcons: Partial<Record<SignupQuestionCategory, ReactNode>> = {
  T: <DirectionsCarOutlinedIcon fontSize="small" />,
  M: <MedicalServicesOutlinedIcon fontSize="small" />,
  I: <GavelOutlinedIcon fontSize="small" />,
  P: <PictureAsPdfOutlinedIcon fontSize="small" />,
};

type MeetSignupQuestionGroupProps = {
  category: SignupQuestionCategory;
  hasError: boolean;
  children: ReactNode;
};

export function MeetSignupQuestionGroup({
  category,
  hasError,
  children,
}: MeetSignupQuestionGroupProps) {
  const [expanded, setExpanded] = useState(true);

  if (category === "N") {
    return <Stack spacing={2}>{children}</Stack>;
  }

  return (
    <Accordion
      expanded={hasError || expanded}
      onChange={(_, nextExpanded) => setExpanded(nextExpanded)}
      disableGutters
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: "8px !important",
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === "dark"
              ? theme.palette.grey[800]
              : theme.palette.grey[200],
          "& .MuiAccordionSummary-content": { my: 1 },
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {categoryIcons[category]}
          <Typography fontWeight={700}>{categoryLabels[category]}</Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2 }}>
        <Stack spacing={2}>{children}</Stack>
      </AccordionDetails>
    </Accordion>
  );
}
