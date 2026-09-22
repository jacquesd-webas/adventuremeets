import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useFetchMyIceInfo } from "../../hooks/useFetchMyIceInfo";
import { useUpdateMyIceInfo } from "../../hooks/useUpdateMyIceInfo";
import { useNotistack } from "../../hooks/useNotistack";
import {
  buildInternationalPhone,
  getDefaultPhoneCountry,
  InternationalPhoneField,
  splitInternationalPhone,
} from "../formFields/InternationalPhoneField";
import { getLocaleDefaults } from "../../helpers/locale";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const actionButtonSx = { alignSelf: "center", minWidth: 180 };

export function ProfileICE() {
  const { success } = useNotistack();
  const {
    data: iceInfo,
    isLoading: isIceLoading,
    error: iceError,
  } = useFetchMyIceInfo(true);
  const {
    updateMyIceInfoAsync,
    isLoading: isIceSaving,
    error: iceSaveError,
  } = useUpdateMyIceInfo();
  const [icePhoneCountry, setIcePhoneCountry] = useState(() => {
    const localeCountry = getLocaleDefaults().countryCode;
    return getDefaultPhoneCountry(localeCountry);
  });
  const [icePhoneLocal, setIcePhoneLocal] = useState("");
  const [iceName, setIceName] = useState("");
  const [iceMedicalAid, setIceMedicalAid] = useState("");
  const [iceMedicalAidNumber, setIceMedicalAidNumber] = useState("");
  const [iceMedicalHistory, setIceMedicalHistory] = useState("");
  const [iceDob, setIceDob] = useState("");
  const [emergencySaved, setEmergencySaved] = useState(false);

  useEffect(() => {
    if (iceInfo?.icePhone) {
      const parsed = splitInternationalPhone(iceInfo.icePhone);
      setIcePhoneCountry(parsed.country);
      setIcePhoneLocal(parsed.local);
    } else {
      const localeCountry = getLocaleDefaults().countryCode;
      setIcePhoneCountry(getDefaultPhoneCountry(localeCountry));
      setIcePhoneLocal("");
    }
    setIceName(iceInfo?.iceName ?? "");
    setIceMedicalAid(iceInfo?.iceMedicalAid ?? "");
    setIceMedicalAidNumber(iceInfo?.iceMedicalAidNumber ?? "");
    setIceMedicalHistory(iceInfo?.iceMedicalHistory ?? "");
    setIceDob(iceInfo?.iceDob ? iceInfo.iceDob.slice(0, 10) : "");
  }, [iceInfo]);

  const handleSaveEmergency = async () => {
    const icePhone = buildInternationalPhone(icePhoneCountry, icePhoneLocal);
    await updateMyIceInfoAsync({
      iceName: iceName.trim() || null,
      icePhone: icePhone || null,
      iceMedicalAid: iceMedicalAid.trim() || null,
      iceMedicalAidNumber: iceMedicalAidNumber.trim() || null,
      iceMedicalHistory: iceMedicalHistory.trim() || null,
      iceDob: iceDob ? new Date(`${iceDob}T00:00:00.000Z`).toISOString() : null,
    });
    success("Emergency info updated");
    setEmergencySaved(true);
    window.setTimeout(() => setEmergencySaved(false), 1500);
  };

  return (
    <Stack
      spacing={2}
      sx={{ minHeight: 320, display: "flex" }}
      alignItems="flex-start"
    >
      <Box>
        <Typography variant="h6">Emergency Info</Typography>
        <Typography variant="body2" color="text.secondary">
          Emergency contact and medical information will only be available to
          the meet organiser and only on the day of the meet. It is recommended
          that you carry your medical information on your person, in case you
          are unresponsive and the meet organiser is not able to access your
          information for first responders.
        </Typography>
      </Box>
      <TextField
        label="Emergency contact name"
        value={iceName}
        onChange={(e) => setIceName(e.target.value)}
        fullWidth
        disabled={isIceLoading || isIceSaving}
      />
      <InternationalPhoneField
        country={icePhoneCountry}
        local={icePhoneLocal}
        onCountryChange={(value) => setIcePhoneCountry(value)}
        onLocalChange={(value) => setIcePhoneLocal(value)}
      />
      <TextField
        label="Medical aid"
        value={iceMedicalAid}
        onChange={(e) => setIceMedicalAid(e.target.value)}
        fullWidth
        disabled={isIceLoading || isIceSaving}
      />
      <TextField
        label="Medical aid number"
        value={iceMedicalAidNumber}
        onChange={(e) => setIceMedicalAidNumber(e.target.value)}
        fullWidth
        disabled={isIceLoading || isIceSaving}
      />
      <TextField
        label="Date of birth"
        type="date"
        value={iceDob}
        onChange={(e) => setIceDob(e.target.value)}
        fullWidth
        disabled={isIceLoading || isIceSaving}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="Medical history"
        value={iceMedicalHistory}
        onChange={(e) => setIceMedicalHistory(e.target.value)}
        fullWidth
        multiline
        minRows={4}
        disabled={isIceLoading || isIceSaving}
      />
      {iceError ? <Alert severity="error">{iceError}</Alert> : null}
      {iceSaveError ? <Alert severity="error">{iceSaveError}</Alert> : null}
      <Box sx={{ flexGrow: 1 }} />
      <Button
        variant="contained"
        onClick={() => void handleSaveEmergency()}
        disabled={isIceLoading || isIceSaving}
        sx={actionButtonSx}
        startIcon={
          emergencySaved ? <CheckCircleIcon fontSize="small" /> : undefined
        }
      >
        {isIceSaving
          ? "Saving..."
          : emergencySaved
            ? "Saved"
            : "Save emergency info"}
      </Button>
    </Stack>
  );
}
