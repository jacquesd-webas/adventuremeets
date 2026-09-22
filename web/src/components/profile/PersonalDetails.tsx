import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useUpdateUser } from "../../hooks/useUpdateUser";
import { useAuth } from "../../context/authContext";
import {
  buildInternationalPhone,
  getDefaultPhoneCountry,
  InternationalPhoneField,
  splitInternationalPhone,
} from "../formFields/InternationalPhoneField";
import { getLocaleDefaults } from "../../helpers/locale";
import { useNotistack } from "../../hooks/useNotistack";
import { NameField } from "../formFields/NameField";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const actionButtonSx = { alignSelf: "center", minWidth: 180 };

export function PersonalDetails() {
  const { user } = useAuth();
  const { success } = useNotistack();
  const {
    updateUserAsync,
    isLoading: isUserSaving,
    error: userError,
  } = useUpdateUser();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(() => {
    const localeCountry = getLocaleDefaults().countryCode;
    return getDefaultPhoneCountry(localeCountry);
  });
  const [phoneLocal, setPhoneLocal] = useState("");
  const [personalSaved, setPersonalSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    if (user.phone) {
      const parsed = splitInternationalPhone(user.phone);
      setPhoneCountry(parsed.country);
      setPhoneLocal(parsed.local);
      return;
    }
    const localeCountry = getLocaleDefaults().countryCode;
    setPhoneCountry(getDefaultPhoneCountry(localeCountry));
    setPhoneLocal("");
  }, [user]);

  const handleSavePersonal = async () => {
    if (!user) return;
    const phone = buildInternationalPhone(phoneCountry, phoneLocal);
    await updateUserAsync({
      id: user.id,
      firstName,
      lastName,
      phone,
    });
    success("Personal details updated");
    setPersonalSaved(true);
    window.setTimeout(() => setPersonalSaved(false), 1500);
  };

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">Personal details</Typography>
        <Typography variant="body2" color="text.secondary">
          Update your personal details.
        </Typography>
      </Box>
      <NameField
        label="First name"
        value={firstName}
        onChange={(value) => setFirstName(value)}
        fullWidth
      />
      <NameField
        label="Last name"
        value={lastName}
        onChange={(value) => setLastName(value)}
        fullWidth
      />
      <InternationalPhoneField
        country={phoneCountry}
        local={phoneLocal}
        onCountryChange={(value) => setPhoneCountry(value)}
        onLocalChange={(value) => setPhoneLocal(value)}
      />
      {userError ? <Alert severity="error">{userError}</Alert> : null}
      <Box sx={{ flexGrow: 1 }} />
      <Button
        variant="contained"
        onClick={() => void handleSavePersonal()}
        disabled={isUserSaving}
        sx={actionButtonSx}
        startIcon={
          personalSaved ? <CheckCircleIcon fontSize="small" /> : undefined
        }
      >
        {personalSaved ? "Saved" : "Save personal details"}
      </Button>
    </Stack>
  );
}
