import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCurrentOrganization } from "../../context/organizationContext";
import { useFetchOrganizationMetaDefinitions } from "../../hooks/useFetchOrganizationMetaDefinitions";
import { useFetchUserMetaValues } from "../../hooks/useFetchUserMetaValues";
import { useUpdateUserMetaValues } from "../../hooks/useUpdateUserMetaValues";
import { useAuth } from "../../context/authContext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const actionButtonSx = { alignSelf: "center", minWidth: 180 };

function LabeledField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" fontWeight={700}>
        {label} {required ? <span style={{ color: "#ef4444" }}>*</span> : null}
      </Typography>
      {children}
    </Stack>
  );
}

export function ProfileAutoFill() {
  const { user } = useAuth();
  const { currentOrganizationId } = useCurrentOrganization();
  const [autoFillSaved, setAutoFillSaved] = useState(false);
  const [autoFillValues, setAutoFillValues] = useState<Record<string, any>>({});
  const autoFillLoadedRef = useRef(false);
  const {
    data: metaDefinitions,
    isLoading: metaLoading,
    error: metaError,
  } = useFetchOrganizationMetaDefinitions(currentOrganizationId || undefined);
  const {
    data: userMetaValues,
    isLoading: userMetaLoading,
    error: userMetaError,
  } = useFetchUserMetaValues(user?.id, currentOrganizationId || undefined);
  const {
    updateMetaValuesAsync,
    isLoading: userMetaSaving,
    error: userMetaSaveError,
  } = useUpdateUserMetaValues();

  const setAutoFillValue = (key: string, value: string | number | boolean) => {
    setAutoFillValues((prev) => ({ ...prev, [key]: value }));
  };

  const parseMetaValue = (
    fieldType: string,
    value: string | number | boolean | null,
  ): string | number | boolean => {
    if (value === null || value === undefined) {
      return fieldType === "checkbox" || fieldType === "switch" ? false : "";
    }
    if (fieldType === "number") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? "" : parsed;
    }
    if (fieldType === "checkbox" || fieldType === "switch") {
      return value === true || value === "true";
    }
    return String(value);
  };

  useEffect(() => {
    autoFillLoadedRef.current = false;
    setAutoFillValues({});
  }, [currentOrganizationId, user?.id]);

  useEffect(() => {
    if (autoFillLoadedRef.current) return;
    if (!metaDefinitions.length || userMetaLoading) return;
    const byKey = new Map(userMetaValues.map((item) => [item.key, item.value]));
    const initialValues: Record<string, any> = {};
    metaDefinitions.forEach((definition) => {
      const raw = byKey.get(definition.fieldKey) ?? null;
      initialValues[definition.fieldKey] = parseMetaValue(
        definition.fieldType,
        raw,
      );
    });
    setAutoFillValues(initialValues);
    autoFillLoadedRef.current = true;
  }, [metaDefinitions, userMetaLoading, userMetaValues]);

  const handleSaveAutoFill = async () => {
    if (!user || !currentOrganizationId) return;
    const fieldKeys = new Set<string>([
      ...metaDefinitions.map((definition) => definition.fieldKey),
      ...userMetaValues.map((item) => item.key),
    ]);
    const definitionByKey = new Map(
      metaDefinitions.map((definition) => [definition.fieldKey, definition]),
    );
    const values = Array.from(fieldKeys).map((key) => {
      const raw = autoFillValues[key];
      const fieldType = definitionByKey.get(key)?.fieldType;
      let value: string | null;
      if (raw === "" || raw === undefined || raw === null) {
        value = null;
      } else if (
        typeof raw === "boolean" ||
        fieldType === "checkbox" ||
        fieldType === "switch"
      ) {
        value = raw ? "true" : "false";
      } else {
        value = String(raw);
      }
      return { key, value };
    });
    await updateMetaValuesAsync({
      userId: user.id,
      organizationId: currentOrganizationId,
      values,
    });
    setAutoFillSaved(true);
    window.setTimeout(() => setAutoFillSaved(false), 1500);
  };

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">AutoFill</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage default details used for meet applications.
        </Typography>
      </Box>
      {metaLoading || userMetaLoading ? (
        <Typography variant="body2" color="text.secondary">
          Loading organisation questions...
        </Typography>
      ) : metaError || userMetaError ? (
        <Alert severity="error">{metaError || userMetaError}</Alert>
      ) : metaDefinitions.length ? (
        <Stack spacing={2} sx={{ width: "100%" }}>
          {metaDefinitions.map((item) => {
            const key = item.fieldKey;
            const value = autoFillValues[key];
            if (item.fieldType === "checkbox" || item.fieldType === "switch") {
              return (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      checked={Boolean(value)}
                      onChange={(e) => setAutoFillValue(key, e.target.checked)}
                    />
                  }
                  label={`${item.label}${item.required ? " *" : ""}`}
                />
              );
            }
            if (item.fieldType === "select") {
              const options = Array.isArray(item.config?.options)
                ? item.config.options
                : [];
              return (
                <LabeledField
                  key={key}
                  label={item.label}
                  required={item.required}
                >
                  <TextField
                    select
                    value={typeof value === "string" ? value : ""}
                    onChange={(e) => setAutoFillValue(key, e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="">Select an option</MenuItem>
                    {options.map((option: string) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </LabeledField>
              );
            }
            return (
              <LabeledField
                key={key}
                label={item.label}
                required={item.required}
              >
                <TextField
                  type={item.fieldType === "number" ? "number" : "text"}
                  value={
                    typeof value === "number" || typeof value === "string"
                      ? value
                      : ""
                  }
                  onChange={(e) =>
                    setAutoFillValue(
                      key,
                      item.fieldType === "number" && e.target.value !== ""
                        ? Number(e.target.value)
                        : e.target.value,
                    )
                  }
                  fullWidth
                />
              </LabeledField>
            );
          })}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No organisation questions found.
        </Typography>
      )}
      <Box sx={{ flexGrow: 1 }} />
      <Button
        variant="contained"
        sx={actionButtonSx}
        disabled={
          metaLoading || userMetaLoading || Boolean(metaError || userMetaError)
        }
        onClick={() => void handleSaveAutoFill()}
        startIcon={
          autoFillSaved ? <CheckCircleIcon fontSize="small" /> : undefined
        }
      >
        {userMetaSaving
          ? "Saving..."
          : autoFillSaved
            ? "Saved"
            : "Save AutoFill"}
      </Button>
      {userMetaSaveError ? (
        <Alert severity="error">{userMetaSaveError}</Alert>
      ) : null}
    </Stack>
  );
}
