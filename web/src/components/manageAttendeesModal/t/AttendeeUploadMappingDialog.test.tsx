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
        questions={[]}
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
        questions={[{ id: "q-1", label: "Dietary needs", fieldKey: "diet" }]}
        onAssignmentChange={onAssignmentChange}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    fireEvent.mouseDown(screen.getByLabelText("Use Contact as"));

    expect(screen.getByRole("option", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Phone" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Status" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Ignore column" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Append to Name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Dietary needs" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: "Email" }));
    expect(onAssignmentChange).toHaveBeenCalledWith(0, "email");

    fireEvent.mouseDown(screen.getByLabelText("Use Contact as"));
    fireEvent.click(screen.getByRole("option", { name: "Dietary needs" }));
    expect(onAssignmentChange).toHaveBeenCalledWith(0, "question:1");
  });

  it("shows the combined name in the import preview", () => {
    render(
      <AttendeeUploadMappingDialog
        open
        columns={[
          { columnIndex: 0, header: "First name", previewValues: ["Alex"] },
          { columnIndex: 1, header: "Surname", previewValues: ["Rider"] },
          {
            columnIndex: 2,
            header: "Email",
            previewValues: ["alex@example.com"],
          },
        ]}
        assignments={["name", "append_to_name", "email"]}
        questions={[]}
        onAssignmentChange={vi.fn()}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Alex Rider")).toBeInTheDocument();
  });
});
