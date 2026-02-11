import { Stack, TextField } from "@mui/material";
import { LabeledField } from "./LabeledField";
import { StepProps, getFieldError } from "./CreateMeetState";
import { UserSelect, UserOption } from "./UserSelect";
import { useFetchOrganizers } from "../../hooks/useFetchOrganizers";
import { useAuth } from "../../context/authContext";
import { useCurrentOrganization } from "../../context/organizationContext";

export const BasicInfoStep = ({ state, setState, errors }: StepProps) => {
  const { user } = useAuth();
  const { currentOrganizationId } = useCurrentOrganization();
  const { data: users } = useFetchOrganizers(currentOrganizationId);
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
    <Stack spacing={2}>
      <LabeledField label="Meet name" required>
        <TextField
          placeholder="Give your meet a name"
          value={state.name}
          error={Boolean(getFieldError(errors, "name"))}
          helperText={getFieldError(errors, "name")}
          onChange={(e) =>
            setState((prev) => ({ ...prev, name: e.target.value }))
          }
          fullWidth
        />
      </LabeledField>
      <LabeledField label="Description" required>
        <TextField
          placeholder="Describe your meet in detail here"
          value={state.description}
          error={Boolean(getFieldError(errors, "description"))}
          helperText={getFieldError(errors, "description")}
          onChange={(e) =>
            setState((prev) => ({ ...prev, description: e.target.value }))
          }
          fullWidth
          multiline
          minRows={6}
        />
      </LabeledField>
      <LabeledField label="Organizer" required>
        <UserSelect
          value={state.organizerId}
          onChange={(value) =>
            setState((prev) => ({ ...prev, organizerId: value }))
          }
          options={organizerOptions}
          currentUserId={user?.id}
          error={Boolean(getFieldError(errors, "organizerId"))}
          helperText={getFieldError(errors, "organizerId")}
        />
      </LabeledField>
    </Stack>
  );
};
