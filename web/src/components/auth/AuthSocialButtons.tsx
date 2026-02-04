import { Button, Stack } from "@mui/material";
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
          sx={{ flex: 1, minWidth: 0 }}
          startIcon={
            <img src="/static/google.svg" alt="Google" width={18} height={18} />
          }
          disabled
        >
          Google
        </Button>
        <Button
          variant="outlined"
          sx={{ flex: 1, minWidth: 0 }}
          startIcon={
            <img
              src="/static/microsoft.svg"
              alt="Microsoft"
              width={18}
              height={18}
            />
          }
        >
          Microsoft
        </Button>
        <Button
          variant="outlined"
          sx={{ flex: 1, minWidth: 0 }}
          startIcon={
            <img
              src="/static/facebook.svg"
              alt="Facebook"
              width={18}
              height={18}
            />
          }
          disabled
        >
          Facebook
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
        startIcon={
          <img src="/static/google.svg" alt="Google" width={18} height={18} />
        }
        fullWidth
        disabled
      >
        Continue with Google (coming soon)
      </Button>
      <Button
        variant="outlined"
        startIcon={
          <img
            src="/static/microsoft.svg"
            alt="Microsoft"
            width={18}
            height={18}
          />
        }
        fullWidth
        disabled
      >
        Continue with Microsoft (coming soon)
      </Button>
      <Button
        variant="outlined"
        startIcon={
          <img
            src="/static/facebook.svg"
            alt="Facebook"
            width={18}
            height={18}
          />
        }
        fullWidth
        disabled
      >
        Continue with Facebook (coming soon)
      </Button>
    </Stack>
  );
}
