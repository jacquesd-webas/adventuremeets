import { useEffect, useMemo, useState } from "react";
import { Box, Button, IconButton, Paper, Portal, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { steps, initialState, CreateMeetState } from "./CreateMeetState";
import { BasicInfoStep } from "./BasicInfoStep";
import { TimeAndLocationStep } from "./TimeAndLocationStep";
import { IndemnityStep } from "./IndemnityStep";
import { QuestionsStep } from "./QuestionsStep";
import { LimitsStep } from "./LimitsStep";
import { CostsStep } from "./CostsStep";
import { ResponsesStep } from "./ResponsesStep";

type CreateMeetModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateMeetModal({ open, onClose }: CreateMeetModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [state, setState] = useState<CreateMeetState>(initialState);

  useEffect(() => {
    if (!open) {
      setActiveStep(0);
    }
  }, [open]);

  const isLastStep = useMemo(() => activeStep >= steps.length - 1, [activeStep]);

  const handleNext = () => {
    if (isLastStep) {
      onClose();
      setActiveStep(0);
      return;
    }
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrev = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <BasicInfoStep state={state} setState={(fn) => setState(fn)} />;
      case 1:
        return <TimeAndLocationStep state={state} setState={(fn) => setState(fn)} />;
      case 2:
        return <IndemnityStep state={state} setState={(fn) => setState(fn)} />;
      case 3:
        return <QuestionsStep state={state} setState={(fn) => setState(fn)} />;
      case 4:
        return <LimitsStep state={state} setState={(fn) => setState(fn)} />;
      case 5:
        return <CostsStep state={state} setState={(fn) => setState(fn)} />;
      case 6:
        return <ResponsesStep state={state} setState={(fn) => setState(fn)} />;
      default:
        return <Typography color="text.secondary">Form coming soon.</Typography>;
    }
  };

  if (!open) return null;

  return (
    <Portal>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          bgcolor: "rgba(15,23,42,0.45)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1400
        }}
      >
        <Paper
          elevation={4}
          sx={{
            width: "min(960px, 94vw)",
            height: "90vh",
            p: 3,
            display: "flex",
            flexDirection: "column"
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight={700}>
              New meet
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Stack direction="row" spacing={3} sx={{ flex: 1, overflow: "hidden" }}>
            <Box sx={{ minWidth: 220, pr: 2, borderRight: 1, borderColor: "divider" }}>
              <Stepper activeStep={activeStep} orientation="vertical" nonLinear>
                {steps.map((label, index) => (
                  <Step key={label} completed={index < activeStep}>
                    <StepLabel onClick={() => setActiveStep(index)} sx={{ cursor: "pointer" }}>
                      {label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
            <Stack sx={{ flex: 1, minHeight: 0 }}>
              <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>{renderStep()}</Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", pt: 2, borderTop: 1, borderColor: "divider" }}>
                <Button variant="text" disabled={activeStep === 0} onClick={handlePrev}>
                  Previous
                </Button>
                <Button variant="contained" onClick={handleNext}>
                  {isLastStep ? "Finish" : "Next"}
                </Button>
              </Box>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Portal>
  );
}
