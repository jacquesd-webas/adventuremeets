import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@mui/material", async () => {
  const actual = await vi.importActual<typeof import("@mui/material")>(
    "@mui/material",
  );

  return {
    ...actual,
    Rating: ({ onChange }: { onChange?: (event: any, value: number) => void }) => (
      <button
        type="button"
        aria-label="4 Stars"
        onClick={(event) => {
          onChange?.(event, 4);
        }}
      >
        4 Stars
      </button>
    ),
  };
});

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
    const user = userEvent.setup();

    render(
      <MeetWallPhotoComposer
        meetId="meet-1"
        onCancel={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    const photoOne = new File(["photo-1"], "photo-1.jpg", {
      type: "image/jpeg",
    });
    const photoTwo = new File(["photo-2"], "photo-2.png", {
      type: "image/png",
    });

    await user.upload(input as HTMLInputElement, [photoOne, photoTwo]);

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

  it("posts a text-only wall post without photos", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    createWallItemAsync.mockResolvedValue({});

    render(
      <MeetWallPhotoComposer
        meetId="meet-1"
        onCancel={vi.fn()}
        onCreated={onCreated}
      />,
    );

    await user.type(screen.getByLabelText("Add Post"), "Great meet");
    await user.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      expect(createWallItemAsync).toHaveBeenCalledWith({
        meetId: "meet-1",
        attendeeId: undefined,
        comment: "Great meet",
        stars: undefined,
      });
    });

    expect(success).toHaveBeenCalledWith("Post added");
    expect(onCreated).toHaveBeenCalled();
  });

  it("reveals the rating control when Rate is used", async () => {
    const user = userEvent.setup();

    render(
      <MeetWallPhotoComposer
        meetId="meet-1"
        onCancel={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Rate" }));

    expect(screen.getByRole("button", { name: "4 Stars" })).toBeInTheDocument();
  });

  it("hides the rate button when rating is not allowed", () => {
    render(
      <MeetWallPhotoComposer
        meetId="meet-1"
        allowRating={false}
        onCancel={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Rate" }),
    ).not.toBeInTheDocument();
  });

  it("clears previews after the post with photos is submitted", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    createWallItemAsync.mockResolvedValue({});

    render(
      <MeetWallPhotoComposer
        meetId="meet-1"
        onCancel={vi.fn()}
        onCreated={onCreated}
      />,
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    const photo = new File(["photo-1"], "photo-1.jpg", {
      type: "image/jpeg",
    });

    await user.upload(input as HTMLInputElement, photo);
    await user.click(screen.getByRole("button", { name: "Post" }));

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

    expect(success).toHaveBeenCalledWith("Post added");
    expect(onCreated).toHaveBeenCalled();
  });

  it("creates separate rating and photo entries when a rated post has photos", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    createWallItemAsync.mockResolvedValue({});

    render(
      <MeetWallPhotoComposer
        meetId="meet-1"
        onCancel={vi.fn()}
        onCreated={onCreated}
      />,
    );

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    const photo = new File(["photo-1"], "photo-1.jpg", {
      type: "image/jpeg",
    });

    await user.type(screen.getByLabelText("Add Post"), "Great meet");
    await user.upload(input as HTMLInputElement, photo);
    await user.click(screen.getByRole("button", { name: "Rate" }));
    await user.click(screen.getByRole("button", { name: "4 Stars" }));
    await user.click(screen.getByRole("button", { name: "Post" }));

    await waitFor(() => {
      expect(createWallItemAsync).toHaveBeenNthCalledWith(1, {
        meetId: "meet-1",
        attendeeId: undefined,
        comment: "Great meet",
        stars: 4,
      });
    });

    await waitFor(() => {
      expect(createWallItemAsync).toHaveBeenNthCalledWith(2, {
        meetId: "meet-1",
        attendeeId: undefined,
        file: photo,
        comment: undefined,
        stars: undefined,
      });
    });

    expect(success).toHaveBeenCalledWith("Post added");
    expect(onCreated).toHaveBeenCalled();
  });
});
