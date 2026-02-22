import { Button, Stack, useMediaQuery, useTheme } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";

type AuthSocialButtonsProps = {
  compact?: boolean;
  showEmail?: boolean;
  onSelect?: (provider: "google" | "microsoft" | "facebook" | "email") => void;
};

export function AuthSocialButtons({
  compact = false,
  showEmail = false,
  onSelect,
}: AuthSocialButtonsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const iconOnlySocial = isMobile && compact;
  const iconOnlyButtonSx = iconOnlySocial
    ? {
        px: 1,
        minHeight: 44,
        minWidth: 44,
        justifyContent: "center",
        "& .MuiButton-startIcon": {
          marginLeft: 0,
          marginRight: 0,
        },
      }
    : { minHeight: 44 };

  const handleSelect = (
    provider: "google" | "microsoft" | "facebook" | "email"
  ) => {
    // Social providers disabled for now
    if (provider === "email") {
      onSelect?.(provider);
    }
  };

  if (compact) {
    return (
      <Stack direction="row" spacing={1} sx={{ width: "100%" }} flexWrap="wrap">
        <Button
          variant="outlined"
          sx={{ flex: 1, minWidth: 0, ...iconOnlyButtonSx }}
          startIcon={
            <img src="/static/google.svg" alt="Google" width={18} height={18} />
          }
          aria-label="Google"
          title="Google"
          disabled
        >
          {iconOnlySocial ? null : "Google"}
        </Button>
        <Button
          variant="outlined"
          sx={{ flex: 1, minWidth: 0, ...iconOnlyButtonSx }}
          startIcon={
            <img
              src="/static/microsoft.svg"
              alt="Microsoft"
              width={18}
              height={18}
            />
          }
          aria-label="Microsoft"
          title="Microsoft"
          disabled
        >
          {iconOnlySocial ? null : "Microsoft"}
        </Button>
        <Button
          variant="outlined"
          sx={{ flex: 1, minWidth: 0, ...iconOnlyButtonSx }}
          startIcon={
            <img
              src="/static/facebook.svg"
              alt="Facebook"
              width={18}
              height={18}
            />
          }
          aria-label="Facebook"
          title="Facebook"
          disabled
        >
          {iconOnlySocial ? null : "Facebook"}
        </Button>
        {showEmail && (
          <Button
            variant="outlined"
            sx={{ flex: 1, minWidth: 0 }}
            startIcon={<EmailOutlinedIcon fontSize="small" />}
            onClick={() => handleSelect("email")}
          >
            Email
          </Button>
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5}>
      {showEmail && (
        <Button
          variant="outlined"
          fullWidth
          startIcon={<EmailOutlinedIcon fontSize="small" />}
          onClick={() => handleSelect("email")}
        >
          Continue with Email
        </Button>
      )}
      <Button
        variant="outlined"
        sx={iconOnlyButtonSx}
        startIcon={
          <img src="/static/google.svg" alt="Google" width={18} height={18} />
        }
        fullWidth
        aria-label="Continue with Google"
        title="Continue with Google"
        disabled
      >
        {isMobile ? "Google (coming soon)" : "Continue with Google (coming soon)"}
      </Button>
      <Button
        variant="outlined"
        sx={iconOnlyButtonSx}
        startIcon={
          <img
            src="/static/microsoft.svg"
            alt="Microsoft"
            width={18}
            height={18}
          />
        }
        fullWidth
        aria-label="Continue with Microsoft"
        title="Continue with Microsoft"
        disabled
      >
        {isMobile
          ? "Microsoft (coming soon)"
          : "Continue with Microsoft (coming soon)"}
      </Button>
      <Button
        variant="outlined"
        sx={iconOnlyButtonSx}
        startIcon={
          <img
            src="/static/facebook.svg"
            alt="Facebook"
            width={18}
            height={18}
          />
        }
        fullWidth
        aria-label="Continue with Facebook"
        title="Continue with Facebook"
        disabled
      >
        {isMobile
          ? "Facebook (coming soon)"
          : "Continue with Facebook (coming soon)"}
      </Button>
    </Stack>
  );
}
