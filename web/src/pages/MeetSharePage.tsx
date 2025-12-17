import { Container, Paper, Stack, Typography, Chip, FormControlLabel, Switch, Button, TextField } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PlaceIcon from "@mui/icons-material/Place";
import ScheduleIcon from "@mui/icons-material/Schedule";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import { useParams } from "react-router-dom";
import { useState } from "react";

const sampleMeet = {
  name: "Skyline Ridge Hike",
  description:
    "Join us for a scenic day hike along Skyline Ridge with panoramic views, lunch at the summit, and a relaxed pace suitable for most hikers.",
  location: "Skyline Ridge Trailhead",
  start: "2025-12-02T10:00:00Z",
  end: "2025-12-02T16:00:00Z",
  status: "Open",
  indemnityText:
    "I acknowledge the inherent risks of hiking and accept responsibility for my safety and belongings. I agree to follow the organizer's instructions and release the organizers from liability.",
  requiresIndemnity: true
};

function useMeetShare(code?: string) {
  // Fake hook to mimic react-query style shape
  return {
    data: code ? sampleMeet : null,
    isLoading: false,
    error: null
  };
}

function LabeledField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" fontWeight={700}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </Typography>
      {children}
    </Stack>
  );
}

function MeetSharePage() {
  const { code } = useParams<{ code: string }>();
  const { data: meet, isLoading } = useMeetShare(code);
  const [indemnityAccepted, setIndemnityAccepted] = useState(false);
  const [showIndemnity, setShowIndemnity] = useState(true);
  const [membershipNumber, setMembershipNumber] = useState("");
  const [litterPromise, setLitterPromise] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("");

  const startDate = meet ? new Date(meet.start) : null;
  const endDate = meet ? new Date(meet.end) : null;

  const dateLabel =
    startDate &&
    new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(startDate);

  const startTimeLabel =
    startDate && startDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const durationLabel =
    startDate && endDate
      ? (() => {
          const diffMs = endDate.getTime() - startDate.getTime();
          const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
        })()
      : null;

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        {isLoading && <Typography color="text.secondary">Loading meet...</Typography>}
        {meet && (
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h4" fontWeight={700}>
                {meet.name}
              </Typography>
              <Chip label={meet.status} color="primary" />
            </Stack>
            {dateLabel && (
              <Typography variant="subtitle1" color="text.secondary">
                {dateLabel}
              </Typography>
            )}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems="center"
              justifyContent="flex-start"
              flexWrap="wrap"
              mt={1}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonOutlineIcon fontSize="small" color="disabled" />
                <Typography variant="body2">{meet.organizer || "Bobby Brown"}</Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon fontSize="small" color="disabled" />
                <Typography variant="body2">
                  {startTimeLabel} ({durationLabel || "Duration TBD"})
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <PlaceIcon fontSize="small" color="disabled" />
                <Typography variant="body2">{meet.location}</Typography>
              </Stack>
            </Stack>
            <Typography variant="body1" color="text.secondary">
              {meet.description}
            </Typography>
            <Stack spacing={2} mt={2}>
              <LabeledField label="Membership number" required>
                <TextField
                  placeholder="Enter your membership number"
                  value={membershipNumber}
                  onChange={(e) => setMembershipNumber(e.target.value)}
                  fullWidth
                />
              </LabeledField>
              <LabeledField label="Full name" required>
                <TextField placeholder="Your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} fullWidth />
              </LabeledField>
              <LabeledField label="Email" required>
                <TextField placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
              </LabeledField>
              <LabeledField label="Phone" required>
                <TextField placeholder="Mobile phone number" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
              </LabeledField>
              <LabeledField label="Emergency contact number" required>
                <TextField
                  placeholder="Emergency contact number"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  fullWidth
                />
              </LabeledField>
              <LabeledField label="Fitness level (optional)">
                <TextField
                  select
                  SelectProps={{ native: true }}
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value)}
                  fullWidth
                >
                  <option value="">Select fitness level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </TextField>
              </LabeledField>
              <FormControlLabel
                control={<Switch checked={litterPromise} onChange={(e) => setLitterPromise(e.target.checked)} />}
                label="I promise to pick up litter on the hike"
              />
            </Stack>
            {meet.requiresIndemnity && (
              <Stack spacing={1} mt={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={indemnityAccepted}
                      onChange={(e) => {
                        setIndemnityAccepted(e.target.checked);
                        if (e.target.checked) {
                          setShowIndemnity(false);
                        }
                      }}
                    />
                  }
                  label="I accept the indemnity"
                />
                {indemnityAccepted && (
                  <Button
                    size="small"
                    variant={showIndemnity ? "contained" : "outlined"}
                    onClick={() => setShowIndemnity((prev) => !prev)}
                    sx={{ alignSelf: "flex-start" }}
                  >
                    {showIndemnity ? "Hide indemnity" : "View indemnity"}
                  </Button>
                )}
                {(showIndemnity || !indemnityAccepted) && (
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                    {meet.indemnityText}
                  </Typography>
                )}
              </Stack>
            )}
            <Stack direction="row" justifyContent="center" pt={2}>
              <Button variant="contained" disabled={meet.requiresIndemnity && !indemnityAccepted}>
                Submit application
              </Button>
            </Stack>
          </Stack>
        )}
        {!isLoading && !meet && <Typography color="text.secondary">Meet not found.</Typography>}
      </Paper>
    </Container>
  );
}

export default MeetSharePage;
