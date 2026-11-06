import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";
import { UploadMeetDialog } from "../UploadMeetDialog";

const post = vi.fn();
const postForm = vi.fn();
const patch = vi.fn();
const inspect = vi.fn();
const mapWorkbook = vi.fn();

vi.mock("../../../hooks/useApi", () => ({
  useApi: () => ({ post, postForm, patch }),
}));
vi.mock("notistack", () => ({
  useSnackbar: () => ({ enqueueSnackbar: vi.fn() }),
}));
vi.mock(
  "../../manageAttendeesModal/attendeeUploadWorkbook",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../manageAttendeesModal/attendeeUploadWorkbook")
      >();
    return {
      ...actual,
      inspectAttendeeWorkbook: (...args: unknown[]) => inspect(...args),
      createMappedAttendeeWorkbook: (...args: unknown[]) =>
        mapWorkbook(...args),
    };
  },
);

function renderDialog(onClose = vi.fn()) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <UploadMeetDialog open organizationId="org-1" onClose={onClose} />
    </QueryClientProvider>,
  );
}

describe("UploadMeetDialog", () => {
  beforeEach(() => {
    post.mockReset();
    postForm.mockReset();
    patch.mockReset();
    inspect.mockReset();
    mapWorkbook.mockReset();
    const worksheet = {
      A1: { t: "s", v: "Meet: Forest Walk" },
      A2: { t: "s", v: "Date: 6 November 2026" },
      A3: { t: "s", v: "Organiser: Alex" },
      A5: { t: "s", v: "Name" },
      B5: { t: "s", v: "Email" },
      A6: { t: "s", v: "Alex" },
      B6: { t: "s", v: "alex@example.com" },
      "!ref": "A1:B6",
    };
    inspect.mockResolvedValue({
      columns: [
        { columnIndex: 0, header: "Name", previewValues: ["Alex"] },
        {
          columnIndex: 1,
          header: "Email",
          previewValues: ["alex@example.com"],
        },
      ],
      headerRowIndex: 4,
      workbook: { SheetNames: ["Attendees"], Sheets: { Attendees: worksheet } },
      worksheetName: "Attendees",
    });
    mapWorkbook.mockResolvedValue(new File(["mapped"], "report-mapped.xlsx"));
    post.mockResolvedValue({ id: "meet-1" });
    postForm.mockResolvedValue({ created: 1, conflicts: [] });
    patch.mockResolvedValue({ statusId: 7 });
  });

  it("prefills the report heading, creates one draft meet, then uploads attendees", async () => {
    const onClose = vi.fn();
    renderDialog(onClose);
    const input = screen
      .getByRole("button", { name: "Choose file" })
      .querySelector("input")!;
    fireEvent.change(input, {
      target: { files: [new File(["sheet"], "report.xlsx")] },
    });

    expect(await screen.findByDisplayValue("Forest Walk")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-11-06")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Use columns" }));
    expect(
      await screen.findByRole("combobox", { name: "Organiser" }),
    ).toHaveTextContent("Alex");
    fireEvent.click(
      await screen.findByRole("button", { name: "Create and import" }),
    );

    await waitFor(() => expect(postForm).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe("/meets");
    expect(post.mock.calls[0][1]).toMatchObject({
      name: "Forest Walk",
      organizationId: "org-1",
      statusId: 1,
      reportOrganizerEmail: "alex@example.com",
    });
    expect(postForm.mock.calls[0][0]).toBe("/meets/meet-1/attendees/upload");
    expect(patch).toHaveBeenCalledWith("/meets/meet-1/status", {
      statusId: 7,
      notifyAttendees: undefined,
      reconfirmAttendees: undefined,
    });
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });

  it("uses Nobody when no attendee is selected as organiser", async () => {
    renderDialog();
    const input = screen
      .getByRole("button", { name: "Choose file" })
      .querySelector("input")!;
    fireEvent.change(input, {
      target: { files: [new File(["sheet"], "report.xlsx")] },
    });
    await screen.findByDisplayValue("Forest Walk");
    fireEvent.click(screen.getByRole("button", { name: "Use columns" }));
    fireEvent.mouseDown(
      await screen.findByRole("combobox", { name: "Organiser" }),
    );
    fireEvent.click(await screen.findByRole("option", { name: "Nobody" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Create and import" }),
    );

    await waitFor(() => expect(post).toHaveBeenCalled());
    expect(post.mock.calls[0][1]).toMatchObject({ reportOrganizerEmail: "" });
  });

  it("retries an unsuccessful attendee upload on the same meet", async () => {
    postForm
      .mockRejectedValueOnce(new Error("Upload failed"))
      .mockResolvedValueOnce({ created: 1, conflicts: [] });
    renderDialog();
    const input = screen
      .getByRole("button", { name: "Choose file" })
      .querySelector("input")!;
    fireEvent.change(input, {
      target: { files: [new File(["sheet"], "report.xlsx")] },
    });
    await screen.findByDisplayValue("Forest Walk");
    fireEvent.click(screen.getByRole("button", { name: "Use columns" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Create and import" }),
    );
    await screen.findByText(/Upload failed/);
    fireEvent.click(screen.getByRole("button", { name: "Create and import" }));

    await waitFor(() => expect(postForm).toHaveBeenCalledTimes(2));
    expect(post).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
  });

  it("retries completion without importing attendees again", async () => {
    patch
      .mockRejectedValueOnce(new Error("Completion failed"))
      .mockResolvedValueOnce({ statusId: 7 });
    renderDialog();
    const input = screen
      .getByRole("button", { name: "Choose file" })
      .querySelector("input")!;
    fireEvent.change(input, {
      target: { files: [new File(["sheet"], "report.xlsx")] },
    });
    await screen.findByDisplayValue("Forest Walk");
    fireEvent.click(screen.getByRole("button", { name: "Use columns" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "Create and import" }),
    );
    await screen.findByText(/Completion failed/);
    fireEvent.click(screen.getByRole("button", { name: "Create and import" }));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(2));
    expect(postForm).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(1);
  });
});
