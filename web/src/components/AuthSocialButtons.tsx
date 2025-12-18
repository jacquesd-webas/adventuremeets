import { Button, Stack } from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { useApi } from "../hooks/useApi";

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
  const api = useApi();

  const handleSelect = (provider: "google" | "microsoft" | "facebook" | "email") => {
    if (provider === "google") {
      api
        .get<{ url: string }>("/auth/google/url")
        .then(({ url }) => {
          window.location.assign(url);
        })
        .catch(() => {
          onSelect?.(provider);
        });
      return;
    }
    onSelect?.(provider);
  };

  if (compact) {
    return (
      <Stack
        direction="row"
        spacing={1}
        sx={{ width: "100%" }}
        flexWrap="wrap"
      >
        <Button
          variant="outlined"
          startIcon={
            <img src="/static/google.svg" alt="Google" width={18} height={18} />
          }
          sx={{ flex: 1, minWidth: 0 }}
          onClick={() => handleSelect("google")}
        >
          Google
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
          sx={{ flex: 1, minWidth: 0 }}
          onClick={() => handleSelect("microsoft")}
        >
          Microsoft
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
          sx={{ flex: 1, minWidth: 0 }}
          onClick={() => handleSelect("facebook")}
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
        fullWidth
        startIcon={
          <img src="/static/google.svg" alt="Google" width={20} height={20} />
        }
        onClick={() => handleSelect("google")}
      >
        Continue with Google
      </Button>
      <Button
        variant="outlined"
        fullWidth
        startIcon={
          <img
            src="/static/microsoft.svg"
            alt="Microsoft"
            width={20}
            height={20}
          />
        }
        onClick={() => handleSelect("microsoft")}
      >
        Continue with Microsoft
      </Button>
      <Button
        variant="outlined"
        fullWidth
        startIcon={
          <img
            src="/static/facebook.svg"
            alt="Facebook"
            width={20}
            height={20}
          />
        }
        onClick={() => handleSelect("facebook")}
      >
        Continue with Facebook
      </Button>
    </Stack>
  );
}
