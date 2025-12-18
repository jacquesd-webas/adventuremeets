import { useEffect, useMemo, useState } from "react";
import { Box, Button, IconButton, Paper, Portal, Stack, Step, StepLabel, Stepper, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
import { useApi } from "../../hooks/useApi";
import { useMe } from "../../hooks/useMe";
import { useUsers } from "../../hooks/useUsers";
import { useUpdateMeetStatus } from "../../hooks/useUpdateMeetStatus";
import { getLocaleDefaults } from "../../utils/locale";

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
  const toNumberOrEmpty = (value: any) => (value === null || value === undefined ? "" : Number(value));
  const toCurrencyUnits = (value: any) =>
    value === null || value === undefined ? "" : Number(value) / 100;

  return {
    ...initialState,
    name: meet.name ?? "",
    description: meet.description ?? "",
    organizerId: meet.organizer_id ?? meet.organizerId ?? "",
    location: meet.location ?? "",
    locationLat: toNumberOrEmpty(meet.location_lat ?? meet.locationLat),
    locationLong: toNumberOrEmpty(meet.location_long ?? meet.locationLong),
    startTime: toDateTimeInput(meet.start_time ?? meet.startTime),
    endTime: toDateTimeInput(meet.end_time ?? meet.endTime),
    openingDate: toDateTimeInput(meet.opening_date ?? meet.openingDate),
    closingDate: toDateTimeInput(meet.closing_date ?? meet.closingDate),
    capacity: toNumberOrEmpty(meet.capacity),
    waitlistSize: toNumberOrEmpty(meet.waitlist_size ?? meet.waitlistSize),
    autoApprove: meet.auto_placement ?? meet.autoPlacement ?? true,
    autoCloseWaitlist: meet.auto_promote_waitlist ?? meet.autoPromoteWaitlist ?? false,
    allowGuests: meet.allow_guests ?? meet.allowGuests ?? false,
    maxGuests: toNumberOrEmpty(meet.max_guests ?? meet.maxGuests),
    currency: meet.currency_code ?? meet.currencyCode ?? initialState.currency,
    costCents: toCurrencyUnits(meet.cost_cents ?? meet.costCents),
    depositCents: toCurrencyUnits(meet.deposit_cents ?? meet.depositCents),
    approvedResponse: meet.confirm_message ?? meet.confirmMessage ?? "",
    rejectResponse: meet.reject_message ?? meet.rejectMessage ?? "",
    waitlistResponse: meet.waitlist_message ?? meet.waitlistMessage ?? "",
    indemnityAccepted: meet.has_indemnity ?? meet.hasIndemnity ?? false,
    indemnityText: meet.indemnity ?? "",
    allowMinorSign: meet.allow_minor_indemnity ?? meet.allowMinorIndemnity ?? false,
    questions: Array.isArray(meet.metaDefinitions)
      ? meet.metaDefinitions.map((definition: any) => ({
          id: definition.id ?? crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
          type: definition.fieldType ?? definition.field_type ?? "text",
          label: definition.label ?? "",
          required: definition.required ?? false,
          options: Array.isArray(definition.config?.options) ? definition.config.options : [],
          optionsInput: Array.isArray(definition.config?.options) ? definition.config.options.join(", ") : "",
          fieldKey: definition.fieldKey ?? definition.field_key ?? definition.id
        }))
      : []
  };
};

export function CreateMeetModal({ open, onClose, onCreated, meetId: meetIdProp }: CreateMeetModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [state, setState] = useState<CreateMeetState>(initialState);
  const [meetId, setMeetId] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoadingMeet, setIsLoadingMeet] = useState(false);
  const api = useApi();
  const { updateStatusAsync, isLoading: isPublishing } = useUpdateMeetStatus();
  const { user } = useMe();
  const { users } = useUsers();

  useEffect(() => {
    if (!open) {
      setActiveStep(0);
    }
  }, [open]);

  useEffect(() => {
    if (user?.id && !state.organizerId) {
      setState((prev) => ({ ...prev, organizerId: user.id }));
    }
  }, [user?.id, state.organizerId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSubmitError(null);
    if (!meetIdProp) {
      setMeetId(null);
      setShareCode(null);
      const localeCurrency = getLocaleDefaults().currencyCode;
      setState({ ...initialState, currency: localeCurrency || initialState.currency });
      return;
    }
    setIsLoadingMeet(true);
    setMeetId(meetIdProp);
    const loadMeet = async () => {
      const meet = await api.get<Record<string, any>>(`/meets/${meetIdProp}`);
      setState(mapMeetToState(meet));
      setShareCode(meet.shareCode ?? meet.share_code ?? null);
    };
    loadMeet()
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Failed to load meet";
        setSubmitError(message);
      })
      .finally(() => setIsLoadingMeet(false));
  }, [open, meetIdProp]);

  const isLastStep = useMemo(() => activeStep >= steps.length - 1, [activeStep]);
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
    if (state.capacity === "" || Number(state.capacity) <= 0) missing.push("Capacity");
    return missing;
  }, [state]);

  const buildPayloadForStep = (draft: CreateMeetState, step: number): CreateMeetPayload => {
    switch (step) {
      case 0:
        return {
          name: draft.name || undefined,
          description: draft.description || undefined,
          organizerId: draft.organizerId || undefined
        };
      case 1:
        return {
          location: draft.location || undefined,
          locationLat: draft.locationLat === "" ? undefined : Number(draft.locationLat),
          locationLong: draft.locationLong === "" ? undefined : Number(draft.locationLong),
          startTime: draft.startTime || undefined,
          endTime: draft.endTime || undefined,
          scheduledDate: draft.startTime || undefined
        };
      case 2:
        return {
          hasIndemnity: draft.indemnityAccepted,
          indemnity: draft.indemnityText || undefined,
          allowMinorIndemnity: draft.allowMinorSign
        };
      case 3:
        return {
          metaDefinitions: draft.questions.map((question, index) => ({
            id: question.id,
            fieldKey: question.fieldKey || question.id || `field_${index + 1}`,
            label: question.label,
            fieldType: question.type,
            required: Boolean(question.required),
            config: question.type === "select" ? { options: question.options ?? [] } : {}
          }))
        };
      case 4:
        return {
          openingDate: draft.openingDate || undefined,
          closingDate: draft.closingDate || undefined,
          capacity: draft.capacity === "" ? undefined : Number(draft.capacity),
          waitlistSize: draft.waitlistSize === "" ? undefined : Number(draft.waitlistSize),
          autoPlacement: draft.autoApprove,
          autoPromoteWaitlist: draft.autoCloseWaitlist,
          allowGuests: draft.allowGuests,
          maxGuests: draft.maxGuests === "" ? undefined : Number(draft.maxGuests)
        };
      case 5:
        return {
          currencyCode: draft.currency || undefined,
          costCents: draft.costCents === "" ? undefined : Number(draft.costCents),
          depositCents: draft.depositCents === "" ? undefined : Number(draft.depositCents)
        };
      case 6:
        return {
          confirmMessage: draft.approvedResponse || undefined,
          rejectMessage: draft.rejectResponse || undefined,
          waitlistMessage: draft.waitlistResponse || undefined
        };
      default:
        return {};
    }
  };

  const saveStep = async (step: number) => {
    const payload = buildPayloadForStep(state, meetId ? step : 0);
    if (!meetId) {
      const created = await api.post<Record<string, any>>("/meets", payload);
      setMeetId(created.id);
      setShareCode(created.shareCode ?? created.share_code ?? null);
      return true;
    }
    if (Object.keys(payload).length === 0) {
      return false;
    }
    const updated = await api.patch<Record<string, any>>(`/meets/${meetId}`, payload);
    if (updated?.shareCode || updated?.share_code) {
      setShareCode(updated.shareCode ?? updated.share_code ?? null);
    }
    return true;
  };

  const handleNext = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (isLastStep) {
        if (missingPublishFields.length > 0) {
          setSubmitError(`Missing required fields: ${missingPublishFields.join(", ")}`);
          return;
        }
        if (!meetId) {
          throw new Error("Meet not created yet");
        }
        await updateStatusAsync({ meetId, statusId: 2 });
        onCreated?.();
        setState(initialState);
        setMeetId(null);
        setShareCode(null);
        onClose();
        setActiveStep(0);
        return;
      }
      const didSave = await saveStep(activeStep);
      if (didSave) {
        onCreated?.();
      }
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save meet";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrev = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const renderStep = () => {
    if (isLoadingMeet) {
      return <Typography color="text.secondary">Loading meet details...</Typography>;
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
        if (user?.id && !organizerOptions.some((option) => option.id === user.id)) {
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
          />
        );
      }
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
      case 7:
        return <FinishStep shareCode={shareCode} missingFields={missingPublishFields} />;
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
          {submitError && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {submitError}
            </Typography>
          )}
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
                <Stack direction="row" spacing={1}>
                  {isLastStep && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setState(initialState);
                        setMeetId(null);
                        setShareCode(null);
                        onClose();
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
                    {isLastStep ? (isPublishing ? "Publishing..." : "Publish") : isSubmitting ? "Saving..." : "Next"}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    </Portal>
  );
}
