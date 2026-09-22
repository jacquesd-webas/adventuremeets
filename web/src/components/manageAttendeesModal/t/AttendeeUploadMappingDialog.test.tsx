import { fireEvent, render, screen } from "@testing-library/react";
import { AttendeeUploadMappingDialog } from "../AttendeeUploadMappingDialog";

describe("AttendeeUploadMappingDialog", () => {
  it("shows column data and requires all attendee fields", () => {
    render(
      <AttendeeUploadMappingDialog
        open
        columns={[
          { columnIndex: 0, header: "Participant", previewValues: ["Alex"] },
          {
            columnIndex: 1,
            header: "Contact",
            previewValues: ["alex@example.com"],
          },
        ]}
        assignments={["name", "other"]}
        onAssignmentChange={vi.fn()}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    expect(screen.getByText("Select Email.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Import attendees" }),
    ).toBeDisabled();
  });

  it("offers every required role above each source column", () => {
    const onAssignmentChange = vi.fn();
    render(
      <AttendeeUploadMappingDialog
        open
        columns={[
          { columnIndex: 0, header: "Contact", previewValues: ["Alex"] },
        ]}
        assignments={["other"]}
        onAssignmentChange={onAssignmentChange}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    fireEvent.mouseDown(screen.getByLabelText("Use Contact as"));

    expect(screen.getByRole("option", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Phone" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: "Email" }));
    expect(onAssignmentChange).toHaveBeenCalledWith(0, "email");
  });
});
