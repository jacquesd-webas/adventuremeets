import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { OrganizationMember } from "../../types/MemberModel";
import { useUpdateOrganizationMember } from "../../hooks/useUpdateOrganizationMember";

type EditUsersModalProps = {
  open: boolean;
  onClose: () => void;
  member: OrganizationMember | null;
  organizationId?: string;
};

const baseRoles = ["admin", "organizer", "member"];

export function EditUsersModal({
  open,
  onClose,
  member,
  organizationId,
}: EditUsersModalProps) {
  const { updateMemberAsync, isLoading, error } = useUpdateOrganizationMember();
  const [role, setRole] = useState("member");
  const [status, setStatus] = useState("active");

  useEffect(() => {
    if (!member) return;
    setRole(member.role || "member");
    setStatus(member.status || "active");
  }, [member]);

  const roleOptions = useMemo(() => {
    const options = [...baseRoles];
    if (member?.role && !options.includes(member.role)) {
      options.unshift(member.role);
    }
    return options;
  }, [member?.role]);

  const displayName = useMemo(() => {
    if (!member) return "Member";
    const name = [member.firstName, member.lastName].filter(Boolean).join(" ");
    return name || member.email || "Member";
  }, [member]);

  const isDisabled = status === "disabled";
  const hasChanges = Boolean(
    member && (role !== member.role || status !== member.status)
  );

  const handleSave = async () => {
    if (!member || !organizationId) return;
    await updateMemberAsync({
      organizationId,
      userId: member.id,
      role,
      status,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit user</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="subtitle2">{displayName}</Typography>
          <Typography variant="body2" color="text.secondary">
            {member?.email || "No email"}
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel id="edit-user-role-label">Role</InputLabel>
            <Select
              labelId="edit-user-role-label"
              label="Role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={isDisabled}
                onChange={(event) =>
                  setStatus(event.target.checked ? "disabled" : "active")
                }
              />
            }
            label={isDisabled ? "Disabled" : "Active"}
          />
          {error ? (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!hasChanges || isLoading || !organizationId}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
