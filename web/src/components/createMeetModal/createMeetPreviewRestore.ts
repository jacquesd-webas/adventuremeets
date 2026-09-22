export const EDITING_MEET_RESTORE_KEY = "editing-meet-restore";

export type CreateMeetPreviewRestore = {
  meetId: string | null;
};

function canUseSessionStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.sessionStorage !== "undefined"
  );
}

export function readCreateMeetPreviewRestore(): CreateMeetPreviewRestore | null {
  if (!canUseSessionStorage()) return null;
  const raw = window.sessionStorage.getItem(EDITING_MEET_RESTORE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CreateMeetPreviewRestore;
  } catch {
    return null;
  }
}

export function writeCreateMeetPreviewRestore(
  payload: CreateMeetPreviewRestore,
) {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.setItem(
    EDITING_MEET_RESTORE_KEY,
    JSON.stringify(payload),
  );
}

export function clearCreateMeetPreviewRestore() {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(EDITING_MEET_RESTORE_KEY);
}
