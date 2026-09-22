import { Button, Typography, useTheme } from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "../context/authContext";
import { useCurrentOrganization } from "../context/organizationContext";
import { useFetchOrganization } from "../hooks/useFetchOrganization";

const organizationNamesStorageKey = "organizationNames";

function getStoredOrganizationNames(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const stored = window.localStorage.getItem(organizationNamesStorageKey);
    return stored ? (JSON.parse(stored) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function OrganizationSwitcherButton({ onClick }: { onClick: () => void }) {
  const theme = useTheme();
  const { user } = useAuth();
  const { currentOrganizationId, organizationIds } = useCurrentOrganization();
  const [lastKnownNames, setLastKnownNames] = useState(
    getStoredOrganizationNames,
  );
  const canSwitch = Boolean(user) && organizationIds.length > 1;
  const { data: organization } = useFetchOrganization(
    currentOrganizationId || undefined,
    { enabled: canSwitch, refetchWhenMissing: true },
  );

  useEffect(() => {
    if (!currentOrganizationId || !organization?.name) return;
    setLastKnownNames((current) => {
      if (current[currentOrganizationId] === organization.name) return current;
      const next = { ...current, [currentOrganizationId]: organization.name };
      window.localStorage.setItem(organizationNamesStorageKey, JSON.stringify(next));
      return next;
    });
  }, [currentOrganizationId, organization?.name]);

  if (!canSwitch) return null;

  const missingName = Boolean(currentOrganizationId) && !organization?.name;
  const label = currentOrganizationId
    ? organization?.name || lastKnownNames[currentOrganizationId] || "Organisation"
    : "No Organisation";

  return (
    <Button
      onClick={onClick}
      variant="outlined"
      color="primary"
      size="small"
      data-testid="organization-switcher-button"
      aria-busy={missingName}
      sx={{
        mr: 2,
        maxWidth: 240,
        textTransform: "none",
        fontWeight: 600,
        justifyContent: "flex-start",
        ...(theme.palette.mode === "light"
          ? {
              borderColor: "#000000",
              color: "#000000",
              "&:hover": {
                borderColor: "#000000",
                backgroundColor: "rgba(0, 0, 0, 0.06)",
              },
              "&.Mui-focusVisible": {
                outline: "2px solid #000000",
                outlineOffset: 2,
              },
            }
          : {}),
      }}
    >
      <Typography variant="body2" noWrap>
        {label}
      </Typography>
    </Button>
  );
}
