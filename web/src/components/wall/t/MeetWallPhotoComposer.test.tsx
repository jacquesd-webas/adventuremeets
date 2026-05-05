import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MeetWallPhotoComposer } from "../MeetWallPhotoComposer";

const createWallItemAsync = vi.fn();
const success = vi.fn();
const error = vi.fn();

vi.mock("../../../hooks/useCreateWallItem", () => ({
  useCreateWallItem: () => ({
    createWallItemAsync,
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useNotistack", () => ({
  useNotistack: () => ({
    success,
    error,
  }),
}));

describe("MeetWallPhotoComposer", () => {
  beforeEach(() => {
    createWallItemAsync.mockReset();
    success.mockReset();
    error.mockReset();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn((file: File) => `blob:${file.name}`),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows local thumbnails for selected photos before posting", async () => {
    const photoOne = new File(["photo-1"], "photo-1.jpg", {
      type: "image/jpeg",
    });
    const photoTwo = new File(["photo-2"], "photo-2.png", {
      type: "image/png",
    });

    render(
      <MeetWallPhotoComposer
        meetId="meet-1"
        initialFiles={[photoOne, photoTwo]}
        onCancel={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    expect(screen.getByText("2 photos selected")).toBeInTheDocument();
    expect(screen.getByAltText("photo-1.jpg")).toHaveAttribute(
      "src",
      "blob:photo-1.jpg",
    );
    expect(screen.getByAltText("photo-2.png")).toHaveAttribute(
      "src",
      "blob:photo-2.png",
    );
  });

  it("does not allow posting without selected photos", () => {
    render(
      <MeetWallPhotoComposer
        meetId="meet-1"
        onCancel={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Post Photos" })).toBeDisabled();
  });

  it("posts selected photos and attaches the comment to the first photo", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    createWallItemAsync.mockResolvedValue({});
    const photo = new File(["photo-1"], "photo-1.jpg", {
      type: "image/jpeg",
    });

    render(
      <MeetWallPhotoComposer
        meetId="meet-1"
        initialFiles={[photo]}
        onCancel={vi.fn()}
        onCreated={onCreated}
      />,
    );

    await user.type(screen.getByLabelText("Add Photos"), "Great meet");
    await user.click(screen.getByRole("button", { name: "Post Photos" }));

    await waitFor(() => {
      expect(createWallItemAsync).toHaveBeenCalledWith({
        meetId: "meet-1",
        attendeeId: undefined,
        file: photo,
        comment: "Great meet",
        stars: undefined,
      });
    });

    expect(success).toHaveBeenCalledWith("Photos added");
    expect(onCreated).toHaveBeenCalled();
  });

  it("clears previews after the post with photos is submitted", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    createWallItemAsync.mockResolvedValue({});
    const photo = new File(["photo-1"], "photo-1.jpg", {
      type: "image/jpeg",
    });

    render(
      <MeetWallPhotoComposer
        meetId="meet-1"
        initialFiles={[photo]}
        onCancel={vi.fn()}
        onCreated={onCreated}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Post Photos" }));

    await waitFor(() => {
      expect(createWallItemAsync).toHaveBeenCalledWith({
        meetId: "meet-1",
        attendeeId: undefined,
        file: photo,
        comment: undefined,
        stars: undefined,
      });
    });

    await waitFor(() => {
      expect(screen.queryByAltText("photo-1.jpg")).not.toBeInTheDocument();
    });

    expect(success).toHaveBeenCalledWith("Photos added");
    expect(onCreated).toHaveBeenCalled();
  });

  it("creates separate photo entries when multiple photos are selected", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    createWallItemAsync.mockResolvedValue({});
    const photoOne = new File(["photo-1"], "photo-1.jpg", {
      type: "image/jpeg",
    });
    const photoTwo = new File(["photo-2"], "photo-2.jpg", {
      type: "image/jpeg",
    });

    render(
      <MeetWallPhotoComposer
        meetId="meet-1"
        initialFiles={[photoOne, photoTwo]}
        onCancel={vi.fn()}
        onCreated={onCreated}
      />,
    );

    await user.type(screen.getByLabelText("Add Photos"), "Great meet");
    await user.click(screen.getByRole("button", { name: "Post Photos" }));

    await waitFor(() => {
      expect(createWallItemAsync).toHaveBeenNthCalledWith(1, {
        meetId: "meet-1",
        attendeeId: undefined,
        file: photoOne,
        comment: "Great meet",
        stars: undefined,
      });
    });

    await waitFor(() => {
      expect(createWallItemAsync).toHaveBeenNthCalledWith(2, {
        meetId: "meet-1",
        attendeeId: undefined,
        file: photoTwo,
        comment: undefined,
        stars: undefined,
      });
    });

    expect(success).toHaveBeenCalledWith("Photos added");
    expect(onCreated).toHaveBeenCalled();
  });
});
