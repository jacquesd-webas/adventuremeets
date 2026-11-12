import { useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  Popover,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { attendeeTagChipColors } from "../../helpers/attendeeTagColors";
import {
  useAttendeeTags,
  useMeetAttendeeTags,
  useSaveAttendeeNotesAndTags,
} from "../../hooks/useAttendeeTags";

type AttendeeNotesAndTagsProps = {
  meetId: string;
  attendeeId: string;
  canManageMeet: boolean;
};

export function AttendeeNotesAndTags({
  meetId,
  attendeeId,
  canManageMeet,
}: AttendeeNotesAndTagsProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const attendee = useAttendeeTags(meetId, attendeeId, canManageMeet);
  const meetTags = useMeetAttendeeTags(
    meetId,
    canManageMeet && Boolean(anchorEl),
  );
  const save = useSaveAttendeeNotesAndTags(meetId, attendeeId);
  const savedNotes = attendee.data?.notes ?? "";
  const savedTags = attendee.data?.tags ?? [];
  const normalizedTags = [
    ...new Set([...tags, tagInput].map((tag) => tag.trim()).filter(Boolean)),
  ];
  const invalidTag = normalizedTags.some((tag) => !tag || tag.length > 255);

  const openEditor = (element: HTMLElement) => {
    setNotes(savedNotes);
    setTags(savedTags);
    setTagInput("");
    save.reset();
    setAnchorEl(element);
  };

  const handleSave = async () => {
    if (invalidTag || save.isPending) return;
    try {
      await save.mutateAsync({ notes, tags: normalizedTags });
      setAnchorEl(null);
    } catch {
      // Keep the editor open so the changes can be retried.
    }
  };

  const closeEditor = () => setAnchorEl(null);

  const editorContent = (
    <Stack spacing={2} sx={{ p: 2, width: isMobile ? "100%" : 400 }}>
      <Typography variant="subtitle1">Notes and Tags</Typography>
      <TextField
        label="Notes"
        multiline
        minRows={3}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        inputProps={{ maxLength: 10000 }}
        fullWidth
      />
      <Autocomplete
        multiple
        freeSolo
        disablePortal
        filterSelectedOptions
        options={meetTags.data?.tags ?? []}
        value={tags}
        inputValue={tagInput}
        onInputChange={(_, value, reason) => {
          if (reason === "input" || reason === "clear") setTagInput(value);
        }}
        onChange={(_, value) => {
          setTags(value);
          setTagInput("");
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Tags"
            placeholder="Select or create tags"
            error={invalidTag}
            helperText={
              invalidTag ? "Each tag must be 1–255 characters" : undefined
            }
          />
        )}
      />
      {meetTags.isError ? (
        <Typography variant="caption" color="text.secondary">
          Existing tags could not be loaded. You can still create new tags.
        </Typography>
      ) : null}
      {save.isError ? (
        <Alert severity="error">
          Could not save notes and tags. Please try again.
        </Alert>
      ) : null}
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button onClick={closeEditor} disabled={save.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={invalidTag || save.isPending}
        >
          {save.isPending ? "Saving…" : "Save"}
        </Button>
      </Stack>
    </Stack>
  );

  if (!canManageMeet) return null;

  return (
    <>
      <Typography variant="body2" color="text.secondary">
        Notes and Tags:
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0.5,
          minWidth: 0,
        }}
      >
        {attendee.isLoading ? (
          <Typography variant="body2" color="text.secondary">
            Loading…
          </Typography>
        ) : attendee.isError ? (
          <Alert severity="error">Could not load notes and tags.</Alert>
        ) : (
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {savedNotes ? (
              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
              >
                {savedNotes}
              </Typography>
            ) : null}
            {savedTags.length ? (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0.5,
                  mt: savedNotes ? 0.5 : 0,
                }}
              >
                {savedTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      ...attendeeTagChipColors(tag),
                      height: 18,
                      fontSize: 10,
                      "& .MuiChip-label": { px: 0.75 },
                    }}
                  />
                ))}
              </Box>
            ) : !savedNotes ? (
              <Typography variant="body2" color="text.secondary">
                —
              </Typography>
            ) : null}
          </Box>
        )}
        <IconButton
          size="small"
          aria-label="Edit notes and tags"
          disabled={attendee.isLoading || attendee.isError}
          onClick={(event) => openEditor(event.currentTarget)}
          sx={{ mt: -0.5 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Box>
      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={Boolean(anchorEl)}
          onClose={save.isPending ? undefined : closeEditor}
          data-testid="notes-tags-drawer"
          sx={{ zIndex: theme.zIndex.modal + 1 }}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: "90dvh",
              overflowY: "auto",
            },
          }}
        >
          {editorContent}
        </Drawer>
      ) : (
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={save.isPending ? undefined : closeEditor}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{ zIndex: theme.zIndex.modal + 1 }}
        >
          {editorContent}
        </Popover>
      )}
    </>
  );
}
