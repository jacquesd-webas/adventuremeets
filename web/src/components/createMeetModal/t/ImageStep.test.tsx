import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageStep } from "../ImageStep";

const mockUpdateMeetImageAsync = vi.fn(async () => ({}));
const mockDeleteMeetImageAsync = vi.fn(async () => ({ removed: true }));

let currentImages = [
  {
    id: "image-1",
    meetId: "meet-1",
    url: "https://cdn.example.com/primary.jpg",
    isPrimary: true,
    aspect: "W" as const,
    contentType: "image/jpeg",
  },
  {
    id: "image-2",
    meetId: "meet-1",
    url: "https://cdn.example.com/secondary.jpg",
    isPrimary: false,
    aspect: "O" as const,
    contentType: "image/jpeg",
  },
];

vi.mock("../../../hooks/useFetchMeetImages", () => ({
  useFetchMeetImages: () => ({
    data: currentImages,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../../../hooks/useCreateMeetImage", () => ({
  useCreateMeetImage: () => ({
    createMeetImageAsync: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useUpdateMeetImage", () => ({
  useUpdateMeetImage: () => ({
    updateMeetImageAsync: mockUpdateMeetImageAsync,
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useDeleteMeetImage", () => ({
  useDeleteMeetImage: () => ({
    deleteMeetImageAsync: mockDeleteMeetImageAsync,
    isLoading: false,
  }),
}));

vi.mock("../../../hooks/useNotistack", () => ({
  useNotistack: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

describe("ImageStep", () => {
  beforeEach(() => {
    currentImages = [
      {
        id: "image-1",
        meetId: "meet-1",
        url: "https://cdn.example.com/primary.jpg",
        isPrimary: true,
        aspect: "W" as const,
        contentType: "image/jpeg",
      },
      {
        id: "image-2",
        meetId: "meet-1",
        url: "https://cdn.example.com/secondary.jpg",
        isPrimary: false,
        aspect: "O" as const,
        contentType: "image/jpeg",
      },
    ];
    mockUpdateMeetImageAsync.mockClear();
    mockDeleteMeetImageAsync.mockClear();
  });

  it("shows all uploaded images and allows selecting the main image", async () => {
    const user = userEvent.setup();
    const onImagesChange = vi.fn();

    render(
      <ImageStep
        meetId="meet-1"
        onImagesChange={onImagesChange}
      />,
    );

    expect(screen.getAllByRole("img", { name: "Meet" })).toHaveLength(2);
    expect(screen.getByText("Main image")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Set as main image" }));

    expect(mockUpdateMeetImageAsync).toHaveBeenCalledWith({
      meetId: "meet-1",
      imageId: "image-2",
      isPrimary: true,
    });
    expect(onImagesChange).toHaveBeenCalledWith(currentImages);
  });

  it("allows deleting an uploaded image", async () => {
    const user = userEvent.setup();

    render(<ImageStep meetId="meet-1" onImagesChange={vi.fn()} />);

    await user.click(screen.getAllByRole("button", { name: "Delete image" })[0]);

    expect(mockDeleteMeetImageAsync).toHaveBeenCalledWith({
      meetId: "meet-1",
      imageId: "image-1",
    });
  });
});
