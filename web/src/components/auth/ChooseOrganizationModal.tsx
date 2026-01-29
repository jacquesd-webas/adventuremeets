import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCurrentOrganization } from "../../context/organizationContext";
import { useFetchOrganisations } from "../../hooks/useFetchOrganisations";

type ChooseOrganizationModalProps = {
  open: boolean;
  onClose: () => void;
  disableClose?: boolean;
};

export function ChooseOrganizationModal({
  open,
  onClose,
  disableClose = false,
}: ChooseOrganizationModalProps) {
  const { organizationIds, currentOrganizationId, setCurrentOrganizationId } =
    useCurrentOrganization();
  const { data: organizations, isLoading } = useFetchOrganisations({
    page: 1,
    limit: 200,
  });
  const [selectedId, setSelectedId] = useState<string | "">("");
  const autoHandledRef = useRef(false);

  const options = useMemo(
    () => organizations.filter((org) => organizationIds.includes(org.id)),
    [organizations, organizationIds]
  );

  useEffect(() => {
    if (!open) return;
    if (currentOrganizationId) {
      setSelectedId(currentOrganizationId);
      return;
    }
    if (options.length > 0) {
      setSelectedId(options[0].id);
    }
  }, [open, currentOrganizationId, options]);

  useEffect(() => {
    if (!open || isLoading) return;
    if (autoHandledRef.current) return;
    if (options.length === 1) {
      autoHandledRef.current = true;
      setCurrentOrganizationId(options[0].id);
      onClose();
    }
  }, [open, isLoading, options, setCurrentOrganizationId, onClose]);

  useEffect(() => {
    if (!open) {
      autoHandledRef.current = false;
    }
  }, [open]);

  const handleSave = () => {
    if (selectedId) {
      setCurrentOrganizationId(selectedId);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={disableClose ? () => undefined : onClose}
      fullWidth
      maxWidth="sm"
      disableEscapeKeyDown={disableClose}
    >
      <DialogTitle>Choose organisation</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Select the organization you want to work with.
          </Typography>
          <FormControl size="small" fullWidth>
            <InputLabel id="organization-select-label">Organization</InputLabel>
            <Select
              labelId="organization-select-label"
              label="Organization"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              disabled={isLoading}
              MenuProps={{ sx: { zIndex: 1501 } }}
            >
              {options.map((org) => (
                <MenuItem key={org.id} value={org.id}>
                  {org.name || "Untitled organization"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={handleSave} disabled={!selectedId}>
          Choose
        </Button>
      </DialogActions>
    </Dialog>
  );
}
