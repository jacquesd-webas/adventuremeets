import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AttendeeUploadButton } from "../AttendeeUploadButton";

const postForm = vi.fn();
const inspectAttendeeWorkbook = vi.fn();
const guessAttendeeColumnAssignments = vi.fn();
const assignmentsMatchRequiredHeaders = vi.fn();
const createMappedAttendeeWorkbook = vi.fn();

vi.mock("../../../hooks/useApi", () => ({
  useApi: () => ({ postForm }),
}));

vi.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));

vi.mock("../attendeeUploadWorkbook", () => ({
  inspectAttendeeWorkbook: (...args: unknown[]) =>
    inspectAttendeeWorkbook(...args),
  guessAttendeeColumnAssignments: (...args: unknown[]) =>
    guessAttendeeColumnAssignments(...args),
  assignmentsMatchRequiredHeaders: (...args: unknown[]) =>
    assignmentsMatchRequiredHeaders(...args),
  createMappedAttendeeWorkbook: (...args: unknown[]) =>
    createMappedAttendeeWorkbook(...args),
  attendeeColumnLabels: {
    name: "Name",
    email: "Email",
    phone: "Phone",
  },
  attendeeColumnRoles: ["name", "email", "phone"],
  requiredAttendeeColumnRoles: ["name", "email"],
}));

const preview = {
  columns: [
    { columnIndex: 0, header: "Full Name", previewValues: ["Alex"] },
    { columnIndex: 1, header: "Mobile", previewValues: ["+27123456789"] },
    {
      columnIndex: 2,
      header: "Email Address",
      previewValues: ["alex@example.com"],
    },
  ],
  headerRowIndex: 0,
  workbook: {},
  worksheetName: "Attendees",
};

const renderButton = () => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AttendeeUploadButton meetId="meet-1" />
    </QueryClientProvider>,
  );
};

describe("AttendeeUploadButton", () => {
  beforeEach(() => {
    postForm.mockReset();
    inspectAttendeeWorkbook.mockReset();
    guessAttendeeColumnAssignments.mockReset();
    assignmentsMatchRequiredHeaders.mockReset();
    createMappedAttendeeWorkbook.mockReset();
    postForm.mockResolvedValue({ created: 1, skipped: 0, conflicts: [] });
    inspectAttendeeWorkbook.mockResolvedValue(preview);
  });

  it("shows a preview and uploads the user's completed mapping", async () => {
    guessAttendeeColumnAssignments.mockReturnValue(["name", "other", "email"]);
    assignmentsMatchRequiredHeaders.mockReturnValue(false);
    const mappedFile = new File(["mapped"], "attendees-mapped.xlsx");
    createMappedAttendeeWorkbook.mockResolvedValue(mappedFile);
    renderButton();

    const input = screen
      .getByRole("button", { name: "Upload attendees" })
      .querySelector('input[type="file"]') as HTMLInputElement;
    const originalFile = new File(["sheet"], "attendees.xls");
    fireEvent.change(input, { target: { files: [originalFile] } });

    expect(
      await screen.findByText("Match attendee columns"),
    ).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Import attendees" }),
    ).toBeEnabled();

    fireEvent.mouseDown(screen.getByLabelText("Use Mobile as"));
    fireEvent.click(screen.getByRole("option", { name: "Phone" }));
    fireEvent.click(screen.getByRole("button", { name: "Import attendees" }));

    await waitFor(() => {
      expect(createMappedAttendeeWorkbook).toHaveBeenCalledWith(
        preview,
        ["name", "phone", "email"],
        "attendees.xls",
      );
      expect(postForm).toHaveBeenCalled();
    });
    const formData = postForm.mock.calls[0][1] as FormData;
    expect(formData.get("file")).toBe(mappedFile);
  });

  it("uploads a workbook directly when canonical headings are present", async () => {
    guessAttendeeColumnAssignments.mockReturnValue(["name", "email", "phone"]);
    assignmentsMatchRequiredHeaders.mockReturnValue(true);
    renderButton();

    const input = screen
      .getByRole("button", { name: "Upload attendees" })
      .querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["sheet"], "attendees.xlsx");
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(postForm).toHaveBeenCalled());
    expect(
      screen.queryByText("Match attendee columns"),
    ).not.toBeInTheDocument();
    const formData = postForm.mock.calls[0][1] as FormData;
    expect(formData.get("file")).toBe(file);
  });
});
