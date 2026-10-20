import { render, screen } from "@testing-library/react";
import { IndemnityPdfUpload } from "../IndemnityPdfUpload";

let previewBlob: Blob;

vi.mock("../../../hooks/useIndemnityTemplate", () => ({
  useIndemnityTemplate: () => ({
    template: { filename: "consent.pdf" },
    preview: previewBlob,
    isLoadingPreview: false,
    previewError: null,
    upload: { isPending: false, isError: false },
  }),
}));

it("shows the saved PDF in the upload control", async () => {
  previewBlob = new Blob(["%PDF-preview"], { type: "application/pdf" });
  const createObjectURL = vi.fn().mockReturnValue("blob:preview-pdf");
  const revokeObjectURL = vi.fn();
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revokeObjectURL,
  });

  const { unmount } = render(
    <IndemnityPdfUpload meetId="meet-1" setState={vi.fn()} />,
  );

  const preview = await screen.findByTitle("Indemnity PDF preview");
  expect(preview).toHaveAttribute(
    "src",
    expect.stringContaining("blob:preview-pdf"),
  );
  expect(
    screen.getByRole("button", { name: "Replace PDF" }),
  ).toBeInTheDocument();

  unmount();
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:preview-pdf");
});
