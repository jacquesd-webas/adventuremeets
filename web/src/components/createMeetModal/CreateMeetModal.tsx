import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Portal,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VerticalSplitOutlinedIcon from "@mui/icons-material/VerticalSplitOutlined";
import ViewDayOutlinedIcon from "@mui/icons-material/ViewDayOutlined";
import ErrorIcon from "@mui/icons-material/Error";
import ConfirmActionDialog from "../ConfirmActionDialog";
import { BasicInfoStep } from "./BasicInfoStep";
import { TimeAndLocationStep } from "./TimeAndLocationStep";
import { IndemnityStep } from "./IndemnityStep";
import { QuestionsStep } from "./QuestionsStep";
import { LimitsStep } from "./LimitsStep";
import { CostsStep } from "./CostsStep";
import { ResponsesStep } from "./ResponsesStep";
import { FinishStep } from "./FinishStep";
import { ImageStep } from "./ImageStep";
import { useApi } from "../../hooks/useApi";
import { useSaveMeet, SaveMeetPayload } from "../../hooks/useSaveMeet";
import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import { getLocaleDefaults } from "../../helpers/locale";
import { useAuth } from "../../context/authContext";
import MeetStatusEnum from "../../types/MeetStatusEnum";
import {
  steps,
  initialState,
  CreateMeetState,
  mapMeetToState,
  ensureMidnightIfDateOnly,
  toIsoWithOffset,
  validateStep,
  validateAll,
  FieldError,
} from "./CreateMeetState";
import { useCurrentOrganization } from "../../context/organizationContext";

type CreateMeetModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  meetId?: string | null;
};

export function CreateMeetModal({
  open,
  onClose,
  onCreated,
  meetId: meetIdProp,
}: CreateMeetModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [activeStep, setActiveStep] = useState(0);
  const [state, setState] = useState<CreateMeetState>(initialState);
  const [baselineState, setBaselineState] =
    useState<CreateMeetState>(initialState);
  const [dirtyDialogOpen, setDirtyDialogOpen] = useState(false);
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const [pendingClose, setPendingClose] = useState(false);
  const [meetId, setMeetId] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingMeet, setIsLoadingMeet] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showSteps, setShowSteps] = useState(!fullScreen);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const api = useApi();
  const { save: saveMeet } = useSaveMeet(meetIdProp ?? null);
  const { updateStatusAsync, isLoading: isPublishing } = useUpdateMeetStatus();
  const { user } = useAuth();
  const { currentOrganizationId } = useCurrentOrganization();

  const { data: fetchedMeet, isLoading: isFetchingMeet } = useFetchMeet(
    meetIdProp,
    Boolean(open && meetIdProp),
  );

  // Reset to first step when opened/closed
  useEffect(() => {
    if (!open) setActiveStep(0);
  }, [open]);

  // Reset show/hide steps when screen size changes
  useEffect(() => {
    if (open) setShowSteps(!fullScreen);
  }, [open, fullScreen]);


  // Set default organizerId and organizationId to current user and Org when available
  // We also have to set the baseline state here so that the form doesn't think it's dirty
  useEffect(() => {
    if (user && currentOrganizationId) {
      if (!state.organizerId) {
        setState((prev) => ({ ...prev, organizerId: user.id }));
        setBaselineState((prev) => ({ ...prev, organizerId: user.id }));
      }
      if (!state.organizationId) {
        setState((prev) => ({
          ...prev,
          organizationId: currentOrganizationId,
        }));
        setBaselineState((prev) => ({
          ...prev,
          organizationId: currentOrganizationId,
        }));
      }
    }
  }, [user, currentOrganizationId, state.organizerId, state.organizationId]);

  // Clear all errors and form state when modal is closed or opened for a new meet
  useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    setFieldErrors([]);
    if (!meetIdProp) {
      setMeetId(null);
      setShareCode(null);
      const localeCurrency = getLocaleDefaults().currencyCode;
      const fresh = {
        ...initialState,
        currency: localeCurrency || initialState.currency,
      };
      setState(fresh);
      setBaselineState(fresh);
      return;
    }
    setMeetId(meetIdProp);
  }, [open, meetIdProp]);

  // When meet data is fetched, populate the form and baseline state for change tracking
  useEffect(() => {
    if (!open || !meetIdProp) return;
    setIsLoadingMeet(isFetchingMeet);
    if (fetchedMeet) {
      const mapped = mapMeetToState(fetchedMeet as Record<string, any>);
      setState(mapped);
      setBaselineState(mapped);
      setShareCode(
        (fetchedMeet as any).shareCode ??
          (fetchedMeet as any).share_code ??
          null,
      );
      setFieldErrors([]);
    }
  }, [open, meetIdProp, fetchedMeet, isFetchingMeet]);

  // Last step is to publish (different flow)
  const isLastStep = useMemo(
    () => activeStep >= steps.length - 1,
    [activeStep],
  );
  const isDraft = useMemo(
    () => (state.statusId ?? MeetStatusEnum.Draft) === MeetStatusEnum.Draft,
    [state.statusId],
  );

  // Check for dirty form
  const isDirty = useMemo(
    () => JSON.stringify(state) !== JSON.stringify(baselineState),
    [state, baselineState],
  );

  // Errors left to solve on final step before publishing
  const finalErrors = useMemo(
    () => (isLastStep ? validateAll(state) : []),
    [state, isLastStep],
  );

  // Map steps with errors
  const errorSteps = useMemo(
    () => new Set(finalErrors.map((error) => error.step)),
    [finalErrors],
  );

  // How we figure out of user has completed a step or not
  useEffect(() => {
    const trimmedName = state.name.trim();
    const trimmedDescription = state.description.trim();
    const hasBasic = Boolean(
      trimmedName && trimmedDescription && state.organizerId,
    );
    const hasTime = Boolean(state.startTime && state.endTime);
    const hasIndemnity = Boolean(state.indemnityAccepted);
    const hasQuestion = state.questions.length > 0;
    const hasLimits =
      Number(state.capacity) > 0 ||
      Boolean(state.openingDate) ||
      Boolean(state.closingDate);
    const hasCost =
      state.costCents !== "" && !Number.isNaN(Number(state.costCents));
    const hasResponse =
      Boolean(state.approvedResponse?.trim()) ||
      Boolean(state.rejectResponse?.trim()) ||
      Boolean(state.waitlistResponse?.trim());
    const hasImage = Boolean(state.imageFile || state.imagePreview);
    const isPublished =
      (state.statusId ?? null) !== null && state.statusId !== 1;

    const completed: number[] = [];
    if (hasBasic) completed.push(1);
    if (hasTime) completed.push(2);
    if (hasIndemnity) completed.push(3);
    if (hasQuestion) completed.push(4);
    if (hasLimits) completed.push(5);
    if (hasCost) completed.push(6);
    if (hasResponse) completed.push(7);
    if (hasImage) completed.push(8);
    if (isPublished) completed.push(9);
    setCompletedSteps(completed);
  }, [
    state.name,
    state.description,
    state.organizerId,
    state.location,
    state.startTime,
    state.endTime,
    state.indemnityAccepted,
    state.questions,
    state.openingDate,
    state.closingDate,
    state.capacity,
    state.waitlistSize,
    state.costCents,
    state.approvedResponse,
    state.rejectResponse,
    state.waitlistResponse,
    state.statusId,
    state.imageFile,
    state.imagePreview,
    meetId,
    shareCode,
  ]);

  // Each step has different payload shape
  const buildPayloadForStep = (
    draft: CreateMeetState,
    step: number,
  ): SaveMeetPayload => {
    switch (step) {
      case 0:
        return {
          name: draft.name || undefined,
          description: draft.description || undefined,
          organizerId: draft.organizerId || undefined,
          organizationId: draft.organizationId || undefined,
        };
      case 1: {
        const normalizedStartTime = draft.startTimeTbc
          ? ensureMidnightIfDateOnly(draft.startTime)
          : draft.startTime || undefined;
        const normalizedEndTime = draft.endTimeTbc
          ? ensureMidnightIfDateOnly(draft.endTime)
          : draft.endTime || undefined;
        const startTimeWithZone = toIsoWithOffset(normalizedStartTime);
        let endTimeWithZone = toIsoWithOffset(normalizedEndTime);
        if (startTimeWithZone) {
          const startDate = new Date(startTimeWithZone);
          const endDate = endTimeWithZone ? new Date(endTimeWithZone) : null;
          if (
            !endTimeWithZone ||
            !endDate ||
            Number.isNaN(endDate.getTime()) ||
            endDate < startDate
          ) {
            endTimeWithZone = startTimeWithZone;
          }
        }
        return {
          location: draft.location === "" ? "" : draft.location || undefined,
          locationLat:
            draft.useMap && draft.locationLat !== ""
              ? Number(draft.locationLat)
              : undefined,
          locationLong:
            draft.useMap && draft.locationLong !== ""
              ? Number(draft.locationLong)
              : undefined,
          startTime: startTimeWithZone,
          endTime: endTimeWithZone,
          startTimeTbc: draft.startTimeTbc,
          endTimeTbc: draft.endTimeTbc,
          useMap: draft.useMap,
          scheduledDate: startTimeWithZone,
        };
      }
      case 2:
        return {
          hasIndemnity: draft.indemnityAccepted,
          indemnity: draft.indemnityText || undefined,
          allowMinorIndemnity: draft.allowMinorSign,
        };
      case 3:
        return {
          metaDefinitions: draft.questions.map((question, index) => ({
            id: question.id,
            fieldKey: question.fieldKey || question.id || `field_${index + 1}`,
            label: question.label,
            fieldType: question.type,
            required: Boolean(question.required),
            config:
              question.type === "select"
                ? {
                    options: question.options ?? [],
                    includeInReports: Boolean(question.includeInReports),
                  }
                : { includeInReports: Boolean(question.includeInReports) },
          })),
        };
      case 4:
        return {
          openingDate:
            draft.openingDate === ""
              ? null
              : toIsoWithOffset(draft.openingDate || undefined),
          closingDate:
            draft.closingDate === ""
              ? null
              : toIsoWithOffset(draft.closingDate || undefined),
          capacity: draft.capacity === "" ? null : Number(draft.capacity),
          waitlistSize:
            draft.waitlistSize === "" ? null : Number(draft.waitlistSize),
          autoPlacement: draft.autoApprove,
          autoPromoteWaitlist: draft.autoCloseWaitlist,
          allowGuests: draft.allowGuests,
          maxGuests:
            draft.maxGuests === "" ? undefined : Number(draft.maxGuests),
        };
      case 5:
        return {
          currencyCode: draft.currency || undefined,
          costCents:
            draft.costCents === "" ? undefined : Number(draft.costCents),
          depositCents:
            draft.depositCents === "" ? undefined : Number(draft.depositCents),
        };
      case 6:
        return {
          confirmMessage: draft.approvedResponse || undefined,
          rejectMessage: draft.rejectResponse || undefined,
          waitlistMessage: draft.waitlistResponse || undefined,
        };
      default:
        return {};
    }
  };

  // Save method for each step
  const handleSaveStep = async (step: number) => {
    if (step === 7 && meetId) {
      if (!state.imageFile) {
        return false;
      }
      const formData = new FormData();
      formData.append("file", state.imageFile);
      formData.append("isPrimary", "true");
      const headers: Record<string, string> = {};
      const token =
        typeof window !== "undefined"
          ? window.localStorage.getItem("accessToken")
          : null;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(`${api.baseUrl}/meets/${meetId}/images`, {
        method: "POST",
        headers,
        body: formData,
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to upload image");
      }
      return true;
    }
    const payload = buildPayloadForStep(state, meetId ? step : 0);
    if (Object.keys(payload).length === 0) {
      return false;
    }
    const result = await saveMeet(payload, meetId);
    if (!meetId && result?.id) {
      setMeetId(result.id);
    }
    if (result?.shareCode || result?.share_code) {
      setShareCode(result.shareCode ?? result.share_code ?? null);
    }
    if (result?.statusId) {
      setState((prev) => ({
        ...prev,
        statusId: result.statusId ?? prev.statusId,
      }));
    }
    return true;
  };

  // Save method for last step
  const handlePublish = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Make sure there are no erros before publishing
    const errors = validateAll(state);
    if (errors && errors.length > 0) {
      setSubmitError(
        "Please fix the following errors before publishing: " +
          errors.join(", "),
      );
      return;
    }
    try {
      // Really should have a meet ID by now (if not something went horribly wrong)
      if (!meetId) throw new Error("Meet not created yet");

      // If there is no opening date, set it to now to allow opening
      if (!state.openingDate) {
        const payload: SaveMeetPayload = {
          openingDate: toIsoWithOffset(new Date().toISOString()),
        };
        await saveMeet(payload, meetId);
      }

      // If there is no closing date, use the meet start date
      if (!state.closingDate) {
        const payload: SaveMeetPayload = {
          closingDate: toIsoWithOffset(state.startTime || undefined),
        };
        await saveMeet(payload, meetId);
      }

      // Publish the meet
      await updateStatusAsync({ meetId, statusId: MeetStatusEnum.Published });

      // Clear everything
      onCreated?.();
      setState(initialState);
      setMeetId(null);
      setShareCode(null);
      onClose();
      setActiveStep(0);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to publish meet";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndClose = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await handleSaveStep(activeStep);
      setBaselineState(state);
      onCreated?.();
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save changes";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // User clicks "Next"
  const handleNext = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    const errors = validateStep(activeStep, state);
    if (errors && errors.length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }
    setFieldErrors([]);
    try {
      const didSave = await handleSaveStep(activeStep);
      if (didSave) {
        onCreated?.();
      }
      setBaselineState(state);
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save changes";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // User clicks "Prev"
  const handlePrev = () => {
    if (isDirty) {
      setPendingStep(Math.max(activeStep - 1, 0));
      setDirtyDialogOpen(true);
      return;
    }
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  // User manually selects step
  const handleStepChange = (target: number) => {
    if (target === activeStep) return;
    if (isDirty) {
      setPendingStep(target);
      setDirtyDialogOpen(true);
      return;
    }
    setActiveStep(target);
    if (fullScreen) {
      setShowSteps(false);
    }
  };

  // Mobile
  const handleTouchStart = (event: React.TouchEvent) => {
    if (!fullScreen) return;
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (!fullScreen || !touchStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx > 0) {
      setShowSteps(true);
    } else {
      setShowSteps(false);
    }
  };

  // Close the modal
  const handleCancel = () => {
    if (isDirty) {
      setPendingClose(true);
      setDirtyDialogOpen(true);
      return;
    }
    setFieldErrors([]);
    onClose();
  };

  // User is shown modal to confirm discarding changes - handles confirm discarding and reset to baselineState
  const confirmDiscard = () => {
    // Revert to last saved state before continuing the pending action
    setState(baselineState);
    setDirtyDialogOpen(false);
    setFieldErrors([]);
    if (pendingClose) {
      setPendingClose(false);
      onClose();
      return;
    }
    if (pendingStep !== null) {
      setActiveStep(pendingStep);
      setPendingStep(null);
      return;
    }
    // If there was no specific pending step, default to closing the modal
    onClose();
  };

  // User wants to keep editing
  const cancelDiscard = () => {
    setDirtyDialogOpen(false);
    setPendingStep(null);
    setPendingClose(false);
  };

  // Main rendering of the current step
  const renderStep = () => {
    if (isLoadingMeet) {
      return (
        <Typography color="text.secondary">Loading meet details...</Typography>
      );
    }
    switch (activeStep) {
      case 0: {
        return (
          <BasicInfoStep
            state={state}
            setState={(fn) => setState(fn)}
            errors={fieldErrors}
          />
        );
      }
      case 1:
        return (
          <TimeAndLocationStep
            state={state}
            setState={(fn) => setState(fn)}
            errors={fieldErrors}
          />
        );
      case 2:
        return <IndemnityStep state={state} setState={(fn) => setState(fn)} />;
      case 3:
        return <QuestionsStep state={state} setState={(fn) => setState(fn)} />;
      case 4:
        return (
          <LimitsStep
            state={state}
            setState={(fn) => setState(fn)}
            errors={fieldErrors}
          />
        );
      case 5:
        return <CostsStep state={state} setState={(fn) => setState(fn)} />;
      case 6:
        return <ResponsesStep state={state} setState={(fn) => setState(fn)} />;
      case 7:
        return <ImageStep state={state} setState={(fn) => setState(fn)} />;
      case 8:
        return (
          <FinishStep
            state={state}
            setState={(fn) => setState(fn)}
            errors={finalErrors}
            shareCode={shareCode}
          />
        );
      default:
        return (
          <Typography color="text.secondary">Form coming soon.</Typography>
        );
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
          alignItems: fullScreen ? "stretch" : "center",
          zIndex: 1400,
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Paper
          elevation={4}
          sx={{
            width: fullScreen ? "100%" : "min(960px, 94vw)",
            height: fullScreen ? "100%" : "90vh",
            p: fullScreen ? 2 : 3,
            display: "flex",
            flexDirection: "column",
            borderRadius: fullScreen ? 0 : 3,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            mb={2}
          >
            <Typography variant="h6" fontWeight={700}>
              New meet
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                onClick={() => setShowSteps((prev) => !prev)}
                aria-label={showSteps ? "Hide panel" : "Show panel"}
              >
                {showSteps ? (
                  <ViewDayOutlinedIcon />
                ) : (
                  <VerticalSplitOutlinedIcon />
                )}
              </IconButton>
              <IconButton onClick={() => handleCancel()}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>
          {submitError && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {submitError}
            </Typography>
          )}
          <Stack
            direction="row"
            spacing={showSteps ? 3 : 0}
            sx={{ flex: 1, overflow: "hidden" }}
          >
            {showSteps && (
              <Box
                sx={{
                  minWidth: 220,
                  pr: 2,
                  borderRight: 1,
                  borderColor: "divider",
                }}
              >
                <Stepper
                  activeStep={activeStep}
                  orientation="vertical"
                  nonLinear
                >
                  {steps.map((label, index) => (
                    <Step
                      key={label}
                      completed={completedSteps.includes(index + 1)}
                    >
                      <StepLabel
                        icon={
                          errorSteps.has(index) ? (
                            <ErrorIcon
                              color="error"
                              sx={{
                                fontSize: 28,
                                transform: "translateX(-1px)",
                              }}
                            />
                          ) : (
                            index + 1
                          )
                        }
                        onClick={() => handleStepChange(index)}
                        sx={{
                          cursor: "pointer",
                          "& .MuiStepLabel-label": {
                            color: errorSteps.has(index)
                              ? "error.main"
                              : "inherit",
                          },
                        }}
                      >
                        {label}
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            )}
            <Stack sx={{ flex: 1, minHeight: 0 }}>
              <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
                {renderStep()}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  pt: 2,
                  borderTop: 1,
                  borderColor: "divider",
                }}
              >
                <Button
                  variant="text"
                  disabled={activeStep === 0}
                  onClick={handlePrev}
                >
                  Previous
                </Button>
                <Stack direction="row" spacing={1}>
                  {isLastStep && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setState(initialState);
                        setMeetId(null);
                        setShareCode(null);
                        handleCancel();
                        setActiveStep(0);
                      }}
                    >
                      Save & close
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    onClick={
                      isLastStep
                        ? isDraft
                          ? handlePublish
                          : handleSaveAndClose
                        : handleNext
                    }
                    disabled={
                      isSubmitting ||
                      isLoadingMeet ||
                      isPublishing ||
                      (finalErrors && finalErrors.length > 0)
                    }
                  >
                    {isLastStep
                      ? isDraft
                        ? isPublishing
                          ? "Publishing..."
                          : "Publish"
                        : isSubmitting
                          ? "Saving..."
                          : "Save & Close"
                      : isSubmitting
                        ? "Saving..."
                        : "Save & Continue"}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Paper>
        <ConfirmActionDialog
          open={dirtyDialogOpen}
          title="Discard changes?"
          description="You have unsaved changes. Leaving this step will discard them."
          confirmLabel="Discard"
          cancelLabel="Stay"
          onConfirm={confirmDiscard}
          onClose={cancelDiscard}
        />
      </Box>
    </Portal>
  );
}
