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
import ConfirmActionDialog from "../ConfirmActionDialog";
import { steps, initialState, CreateMeetState } from "./CreateMeetState";
import { BasicInfoStep } from "./BasicInfoStep";
import { UserOption } from "./UserSelect";
import { TimeAndLocationStep } from "./TimeAndLocationStep";
import { IndemnityStep } from "./IndemnityStep";
import { QuestionsStep } from "./QuestionsStep";
import { LimitsStep } from "./LimitsStep";
import { CostsStep } from "./CostsStep";
import { ResponsesStep } from "./ResponsesStep";
import { FinishStep } from "./FinishStep";
import { ImageStep } from "./ImageStep";
import { useApi } from "../../hooks/useApi";
import { useSaveMeet } from "../../hooks/useSaveMeet";
import { useUsers } from "../../hooks/useUsers";
import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import { useFetchMeet } from "../../hooks/useFetchMeet";
import { getLocaleDefaults } from "../../helpers/locale";
import { useAuth } from "../../context/AuthContext";

type CreateMeetModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  meetId?: string | null;
};

type CreateMeetPayload = {
  name?: string;
  description?: string;
  organizerId?: string;
  location?: string;
  locationLat?: number;
  locationLong?: number;
  startTime?: string;
  endTime?: string;
  openingDate?: string;
  closingDate?: string;
  scheduledDate?: string;
  confirmDate?: string;
  capacity?: number;
  waitlistSize?: number;
  statusId?: number;
  autoPlacement?: boolean;
  autoPromoteWaitlist?: boolean;
  allowGuests?: boolean;
  maxGuests?: number;
  isVirtual?: boolean;
  accessLink?: string;
  confirmMessage?: string;
  rejectMessage?: string;
  waitlistMessage?: string;
  allowMinorIndemnity?: boolean;
  currencyCode?: string;
  costCents?: number;
  depositCents?: number;
  hasIndemnity?: boolean;
  indemnity?: string;
  metaDefinitions?: {
    id?: string;
    fieldKey: string;
    label: string;
    fieldType: string;
    required?: boolean;
    config?: Record<string, any>;
  }[];
};

const mapMeetToState = (meet: Record<string, any>): CreateMeetState => {
  const toDateTimeInput = (value?: string | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };
  const toNumberOrEmpty = (value: any) =>
    value === null || value === undefined ? "" : Number(value);
  const toCurrencyUnits = (value: any) =>
    value === null || value === undefined ? "" : Number(value) / 100;

  return {
    ...initialState,
    name: meet.name ?? "",
    description: meet.description ?? "",
    organizerId: meet.organizerId ?? "",
    location: meet.location ?? "",
    locationLat: toNumberOrEmpty(meet.locationLat),
    locationLong: toNumberOrEmpty(meet.locationLong),
    startTime: toDateTimeInput(meet.startTime),
    endTime: toDateTimeInput(meet.endTime),
    openingDate: toDateTimeInput(meet.openingDate),
    closingDate: toDateTimeInput(meet.closingDate),
    capacity: toNumberOrEmpty(meet.capacity),
    waitlistSize: toNumberOrEmpty(meet.waitlistSize),
    autoApprove: meet.autoPlacement ?? true,
    autoCloseWaitlist: meet.autoPromoteWaitlist ?? false,
    allowGuests: meet.allowGuests ?? false,
    maxGuests: toNumberOrEmpty(meet.maxGuests),
    currency: meet.currencyCode ?? initialState.currency,
    costCents: toCurrencyUnits(meet.costCents),
    depositCents: toCurrencyUnits(meet.depositCents),
    approvedResponse: meet.confirmMessage ?? "",
    rejectResponse: meet.rejectMessage ?? "",
    waitlistResponse: meet.waitlistMessage ?? "",
    indemnityAccepted: meet.hasIndemnity ?? false,
    indemnityText: meet.indemnity ?? "",
    allowMinorSign: meet.allowMinorIndemnity ?? false,
    questions: Array.isArray(meet.metaDefinitions)
      ? meet.metaDefinitions.map((definition: any) => ({
          id:
            definition.id ??
            crypto.randomUUID?.() ??
            Math.random().toString(36).slice(2),
          type: definition.fieldType ?? definition.field_type ?? "text", // XXX TODO: fix this
          label: definition.label ?? "",
          required: definition.required ?? false,
          options: Array.isArray(definition.config?.options)
            ? definition.config.options
            : [],
          optionsInput: Array.isArray(definition.config?.options)
            ? definition.config.options.join(", ")
            : "",
          fieldKey:
            definition.fieldKey ?? definition.field_key ?? definition.id,
        }))
      : [],
    statusId: meet.statusId ?? null,
  };
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showSteps, setShowSteps] = useState(!fullScreen);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const api = useApi();
  const { save: saveMeet } = useSaveMeet(meetIdProp ?? null);
  const { updateStatusAsync, isLoading: isPublishing } = useUpdateMeetStatus();
  const { user } = useAuth();
  const { users } = useUsers();
  const { data: fetchedMeet, isLoading: isFetchingMeet } = useFetchMeet(
    meetIdProp,
    Boolean(open && meetIdProp)
  );

  useEffect(() => {
    if (!open) {
      setActiveStep(0);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setShowSteps(!fullScreen);
    }
  }, [open, fullScreen]);

  useEffect(() => {
    if (user?.id && !state.organizerId) {
      setState((prev) => ({ ...prev, organizerId: user.id }));
      if (!baselineState.organizerId) {
        setBaselineState((prev) => ({ ...prev, organizerId: user.id }));
      }
    }
  }, [user?.id, state.organizerId, baselineState.organizerId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSubmitError(null);
    setFieldErrors({});
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
          null
      );
      setFieldErrors({});
    }
  }, [open, meetIdProp, fetchedMeet, isFetchingMeet]);

  const isLastStep = useMemo(
    () => activeStep >= steps.length - 1,
    [activeStep]
  );
  const isDirty = useMemo(
    () => JSON.stringify(state) !== JSON.stringify(baselineState),
    [state, baselineState]
  );
  const missingPublishFields = useMemo(() => {
    const missing: string[] = [];
    if (!state.name.trim()) missing.push("Meet name");
    if (!state.description.trim()) missing.push("Description");
    if (!state.organizerId) missing.push("Organizer");
    if (!state.location.trim()) missing.push("Location");
    if (!state.startTime) missing.push("Start time");
    if (!state.endTime) missing.push("End time");
    if (!state.openingDate) missing.push("Applications open");
    if (!state.closingDate) missing.push("Applications close");
    if (state.capacity === "" || Number(state.capacity) < 0)
      missing.push("Capacity");
    if (state.waitlistSize === "" || Number(state.waitlistSize) < 0)
      missing.push("Waitlist size");
    return missing;
  }, [state]);

  const validateStep = (step: number, draft: CreateMeetState) => {
    const errors: Record<string, string> = {};
    switch (step) {
      case 0:
        if (!draft.name.trim()) errors.name = "Meet name is required";
        if (!draft.description.trim())
          errors.description = "Description is required";
        if (!draft.organizerId)
          errors.organizerId = "Please select an organizer";
        break;
      case 1:
        if (!draft.location.trim()) errors.location = "Location is required";
        if (!draft.startTime) errors.startTime = "Start time is required";
        if (!draft.endTime) errors.endTime = "End time is required";
        break;
      case 4:
        if (!draft.openingDate)
          errors.openingDate = "Applications open is required";
        if (!draft.closingDate)
          errors.closingDate = "Applications close is required";
        if (draft.capacity === undefined || draft.capacity === "") {
          errors.capacity = "Capacity is required, use 0 for unlimited";
        } else if (Number(draft.capacity) < 0) {
          errors.capacity = "Capacity cannot be negative";
        }
        if (draft.waitlistSize === undefined || draft.waitlistSize === "") {
          errors.waitlistSize = "Waitlist size is required, use 0 for none";
        } else if (Number(draft.waitlistSize) < 0) {
          errors.waitlistSize = "Waitlist size cannot be negative";
        }
        break;
      default:
        break;
    }
    return errors;
  };

  const validateAllRequired = (draft: CreateMeetState) => {
    return {
      ...validateStep(0, draft),
      ...validateStep(1, draft),
      ...validateStep(4, draft),
    };
  };

  useEffect(() => {
    const trimmedName = state.name.trim();
    const trimmedDescription = state.description.trim();
    const hasBasic = Boolean(
      trimmedName && trimmedDescription && state.organizerId
    );
    const hasTime = Boolean(
      state.location.trim() && state.startTime && state.endTime
    );
    const hasIndemnity = Boolean(state.indemnityAccepted);
    const hasQuestion = state.questions.length > 0;
    const hasLimits =
      Boolean(state.openingDate && state.closingDate) &&
      state.capacity !== "" &&
      Number(state.capacity) >= 0 &&
      state.waitlistSize !== "" &&
      Number(state.waitlistSize) >= 0;
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

  const buildPayloadForStep = (
    draft: CreateMeetState,
    step: number
  ): CreateMeetPayload => {
    switch (step) {
      case 0:
        return {
          name: draft.name || undefined,
          description: draft.description || undefined,
          organizerId: draft.organizerId || undefined,
        };
      case 1:
        return {
          location: draft.location || undefined,
          locationLat:
            draft.locationLat === "" ? undefined : Number(draft.locationLat),
          locationLong:
            draft.locationLong === "" ? undefined : Number(draft.locationLong),
          startTime: draft.startTime || undefined,
          endTime: draft.endTime || undefined,
          scheduledDate: draft.startTime || undefined,
        };
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
                ? { options: question.options ?? [] }
                : {},
          })),
        };
      case 4:
        return {
          openingDate: draft.openingDate || undefined,
          closingDate: draft.closingDate || undefined,
          capacity: draft.capacity === "" ? undefined : Number(draft.capacity),
          waitlistSize:
            draft.waitlistSize === "" ? undefined : Number(draft.waitlistSize),
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
    if (result?.shareCode) {
      setShareCode(result.shareCode ?? null);
    }
    if (result?.statusId) {
      setState((prev) => ({
        ...prev,
        statusId: result.statusId ?? prev.statusId,
      }));
    }
    return true;
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    const errors = isLastStep
      ? validateAllRequired(state)
      : validateStep(activeStep, state);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setIsSubmitting(false);
      return;
    }
    setFieldErrors({});
    try {
      if (isLastStep) {
        if (missingPublishFields.length > 0) {
          setSubmitError(
            `Missing required fields: ${missingPublishFields.join(", ")}`
          );
          return;
        }
        if (!meetId) {
          throw new Error("Meet not created yet");
        }
        await updateStatusAsync({ meetId, statusId: 2 });
        setState((prev) => ({ ...prev, statusId: 2 }));
        onCreated?.();
        setState(initialState);
        setMeetId(null);
        setShareCode(null);
        onClose();
        setActiveStep(0);
        return;
      }
      const didSave = await handleSaveStep(activeStep);
      if (didSave) {
        onCreated?.();
      }
      setBaselineState(state);
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save meet";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrev = () => {
    if (isDirty) {
      setPendingStep(Math.max(activeStep - 1, 0));
      setDirtyDialogOpen(true);
      return;
    }
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

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

  const handleCancel = () => {
    if (isDirty) {
      setPendingClose(true);
      setDirtyDialogOpen(true);
      return;
    }
    setFieldErrors({});
    onClose();
  };

  const confirmDiscard = () => {
    // Revert to last saved state before continuing the pending action
    setState(baselineState);
    setDirtyDialogOpen(false);
    setFieldErrors({});
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

  const cancelDiscard = () => {
    setDirtyDialogOpen(false);
    setPendingStep(null);
    setPendingClose(false);
  };

  const renderStep = () => {
    if (isLoadingMeet) {
      return (
        <Typography color="text.secondary">Loading meet details...</Typography>
      );
    }
    switch (activeStep) {
      case 0: {
        const organizerOptions: UserOption[] = users.map((u) => {
          const label =
            [u.firstName, u.lastName].filter(Boolean).join(" ") ||
            u.idp_profile?.name ||
            (u.email ? u.email.split("@")[0] : u.id);
          return { id: u.id, label };
        });
        if (
          user?.id &&
          !organizerOptions.some((option) => option.id === user.id)
        ) {
          const label =
            [user.firstName, user.lastName].filter(Boolean).join(" ") ||
            user.idp_profile?.name ||
            (user.email ? user.email.split("@")[0] : user.id);
          organizerOptions.unshift({ id: user.id, label });
        }
        return (
          <BasicInfoStep
            state={state}
            setState={(fn) => setState(fn)}
            organizers={organizerOptions}
            currentUserId={user?.id}
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
            shareCode={shareCode}
            missingFields={missingPublishFields}
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
                        onClick={() => handleStepChange(index)}
                        sx={{ cursor: "pointer" }}
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
                    onClick={handleNext}
                    disabled={
                      isSubmitting ||
                      isLoadingMeet ||
                      isPublishing ||
                      (isLastStep && missingPublishFields.length > 0)
                    }
                  >
                    {isLastStep
                      ? isPublishing
                        ? "Publishing..."
                        : "Publish"
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
