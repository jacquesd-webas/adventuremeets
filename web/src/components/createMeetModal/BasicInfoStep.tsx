import { Box, Stack, TextField } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { LabeledField } from "./LabeledField";
import { StepProps, getFieldError } from "./CreateMeetState";
import { UserSelect, UserOption } from "./UserSelect";
import { useFetchOrganizers } from "../../hooks/useFetchOrganizers";
import { useAuth } from "../../context/authContext";
import { useCurrentOrganization } from "../../context/organizationContext";
import { HelpBanner } from "./HelpBanner";

export const BasicInfoStep = ({
  state,
  setState,
  errors = [],
  disabled = false,
  isHelpEnabled = false,
  isHelpBannerDismissed = false,
  onDismissHelpBanner,
}: StepProps) => {
  const { user } = useAuth();
  const { currentOrganizationId } = useCurrentOrganization();
  const { data: users } = useFetchOrganizers(currentOrganizationId);
  const nameError = getFieldError(errors, "name");
  const descriptionError = getFieldError(errors, "description");
  const organizerError = getFieldError(errors, "organizerId");
  // XXX TODO: Fix the user type here and check that idp_profile comes through
  const organizerOptions: UserOption[] = users.map((u: any) => {
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
    <Box sx={{ position: "relative" }}>
      <Stack spacing={2}>
        <LabeledField label="Meet name" required>
          <TextField
            placeholder="Give your meet a name"
            value={state.name}
            error={Boolean(nameError)}
            helperText={
              nameError ||
              (isHelpEnabled
                ? "Use a short descriptive name that will catch people's attention"
                : undefined)
            }
            onChange={(e) =>
              setState((prev) => ({ ...prev, name: e.target.value }))
            }
            fullWidth
            disabled={disabled}
          />
        </LabeledField>
        <LabeledField label="Description" required>
          <TextField
            placeholder="Describe your meet in detail here"
            value={state.description}
            error={Boolean(descriptionError)}
            helperText={
              descriptionError ||
              (isHelpEnabled
                ? "Some short paragraphs to give potential attendees a good idea of what to expect and get them excited to sign up. You can paste links here if you want and they will be clickable."
                : undefined)
            }
            onChange={(e) =>
              setState((prev) => ({ ...prev, description: e.target.value }))
            }
            fullWidth
            multiline
            minRows={6}
            disabled={disabled}
          />
        </LabeledField>
        <LabeledField label="Organiser" required>
          <UserSelect
            value={state.organizerId}
            onChange={(value) =>
              setState((prev) => ({ ...prev, organizerId: value }))
            }
            options={organizerOptions}
            currentUserId={user?.id}
            error={Boolean(organizerError)}
            helperText={
              organizerError ||
              (isHelpEnabled
                ? "Usually this is just you, but if you're admin you can select another organiser to lead the meet."
                : undefined)
            }
            disabled={disabled}
          />
        </LabeledField>
      </Stack>
      {isHelpEnabled && !isHelpBannerDismissed ? (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            p: 1,
            bgcolor: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(1px)",
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 760 }}>
            <HelpBanner
              message={
                <>
                  This is your basic meet information. The name and description
                  you provide here will be visible to everyone who views the
                  meet.
                  <br />
                  <br />
                  You can save and then come back later to edit this information
                  until you're happy with how it looks on the preview. For best
                  results try to keep your description to about 2 or 3 short
                  paragraphs.
                  <br />
                  <br />
                  If this help is annoying you, you can toggle it on and off
                  using the icon at the top that looks like this:{" "}
                  <HelpOutlineIcon sx={{ fontSize: "15px" }} />
                </>
              }
              onDismiss={onDismissHelpBanner || (() => undefined)}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
};
