import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MeetWall } from "../MeetWall";

vi.mock("../../../hooks/useFetchMeetWall", () => ({
  useFetchMeetWall: vi.fn(),
}));

import { useFetchMeetWall } from "../../../hooks/useFetchMeetWall";

vi.mock("../../../context/authContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../../context/authContext";

vi.mock("../../../hooks/useFetchMeet", () => ({
  useFetchMeet: vi.fn(),
}));

import { useFetchMeet } from "../../../hooks/useFetchMeet";

vi.mock("../../../hooks/useUpdateWallItemFavourite", () => ({
  useUpdateWallItemFavourite: vi.fn(),
}));

import { useUpdateWallItemFavourite } from "../../../hooks/useUpdateWallItemFavourite";

vi.mock("../../../hooks/useUpdateWallItemReaction", () => ({
  useUpdateWallItemReaction: vi.fn(),
}));

import { useUpdateWallItemReaction } from "../../../hooks/useUpdateWallItemReaction";

vi.mock("../../../hooks/useNotistack", () => ({
  useNotistack: vi.fn(),
}));

import { useNotistack } from "../../../hooks/useNotistack";

const meetWallCommentComposerSpy = vi.fn();
const updateWallItemFavouriteAsync = vi.fn();
const updateWallItemReactionAsync = vi.fn();
const success = vi.fn();
const error = vi.fn();

vi.mock("../MeetWallCommentComposer", () => ({
  MeetWallCommentComposer: (props: any) => {
    meetWallCommentComposerSpy(props);
    return <div>comment composer</div>;
  },
}));

vi.mock("../MeetWallPhotoComposer", () => ({
  MeetWallPhotoComposer: () => <div>photo composer</div>,
}));

vi.mock("../MeetWallRatingComposer", () => ({
  MeetWallRatingComposer: () => <div>rating composer</div>,
}));

describe("MeetWall", () => {
  beforeEach(() => {
    meetWallCommentComposerSpy.mockReset();
    updateWallItemFavouriteAsync.mockReset();
    updateWallItemReactionAsync.mockReset();
    success.mockReset();
    error.mockReset();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-1" },
      isLoading: false,
      isAuthenticated: true,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    } as any);
    vi.mocked(useFetchMeet).mockReturnValue({
      data: {
        id: "meet-1",
        organizerId: "organizer-1",
        organizationId: "org-1",
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    vi.mocked(useUpdateWallItemFavourite).mockReturnValue({
      updateWallItemFavourite: vi.fn(),
      updateWallItemFavouriteAsync,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(useUpdateWallItemReaction).mockReturnValue({
      updateWallItemReaction: vi.fn(),
      updateWallItemReactionAsync,
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(useNotistack).mockReturnValue({
      success,
      error,
      info: vi.fn(),
      warn: vi.fn(),
    });
  });

  it("renders wall items with image, rating, comment, and likes", () => {
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          comment: "Great day on the mountain",
          stars: 5,
          url: "https://cdn.example.com/photo.jpg",
          authorName: "Alice",
          favourite: 2,
          likesCount: 3,
          likedByMe: false,
          createdAt: "2026-04-29T08:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    expect(screen.getByText("Meet Feedback")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Comment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Photos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rate Meet" })).toBeInTheDocument();
    expect(screen.getByText("Great day on the mountain")).toBeInTheDocument();
    expect(screen.getByLabelText("3 likes")).toBeInTheDocument();
    expect(screen.getByLabelText("Dislike")).toBeInTheDocument();
    expect(screen.getByLabelText("Favourite 2")).toBeInTheDocument();
    expect(screen.getByText(/by Alice/)).toBeInTheDocument();
    expect(screen.getByAltText("Meet wall post")).toBeInTheDocument();
  });

  it("opens the carousel with all wall photos when a photo is clicked", async () => {
    const user = userEvent.setup();

    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-1.jpg",
          authorName: "Alice",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T08:00:00.000Z",
          aspect: "O",
        },
        {
          id: "wall-2",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-2.jpg",
          authorName: "Alice",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T07:59:00.000Z",
          aspect: "W",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    await user.click(screen.getAllByAltText("Meet wall post")[0]);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Meet feedback photos")).toBeInTheDocument();
    expect(
      screen.getByAltText("Meet feedback photos image 1"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Download photo",
      }),
    ).toBeInTheDocument();
  });

  it("allows the organiser to favourite the active photo from the carousel", async () => {
    const user = userEvent.setup();
    updateWallItemFavouriteAsync.mockResolvedValue({
      wallItem: { id: "wall-1", favourite: 1 },
    });

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "organizer-1" },
      isLoading: false,
      isAuthenticated: true,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    } as any);
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-1.jpg",
          authorName: "Alice",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T08:00:00.000Z",
          aspect: "O",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    await user.click(screen.getByAltText("Meet wall post"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Favourite",
      }),
    );

    expect(updateWallItemFavouriteAsync).toHaveBeenCalledWith({
      meetId: "meet-1",
      wallItemId: "wall-1",
      favourite: 1,
    });
  });

  it("does not show the favourite control on the panel for combined photo groups", async () => {
    const user = userEvent.setup();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "organizer-1" },
      isLoading: false,
      isAuthenticated: true,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    } as any);
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-1.jpg",
          authorName: "Alice",
          favourite: 2,
          likesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T08:00:00.000Z",
          aspect: "O",
        },
        {
          id: "wall-2",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-2.jpg",
          authorName: "Alice",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T07:59:00.000Z",
          aspect: "W",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    expect(screen.queryByLabelText("Favourite 2")).not.toBeInTheDocument();

    await user.click(screen.getAllByAltText("Meet wall post")[0]);

    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Favourite 2",
      }),
    ).toBeInTheDocument();
  });

  it("shows the favourite post first with favourite photos attached, then the rest in normal order", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "organizer-1" },
      isLoading: false,
      isAuthenticated: true,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    } as any);
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-normal-post",
          meetId: "meet-1",
          comment: "Normal post",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T08:10:00.000Z",
        },
        {
          id: "wall-fav-photo-1",
          meetId: "meet-1",
          url: "https://cdn.example.com/fav-photo-1.jpg",
          authorName: "Alice",
          favourite: 2,
          likesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T08:00:00.000Z",
          aspect: "O",
        },
        {
          id: "wall-fav-post",
          meetId: "meet-1",
          comment: "Featured recap",
          favourite: 3,
          likesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T07:59:00.000Z",
        },
        {
          id: "wall-fav-photo-2",
          meetId: "meet-1",
          url: "https://cdn.example.com/fav-photo-2.jpg",
          authorName: "Alice",
          favourite: 1,
          likesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T07:58:00.000Z",
          aspect: "W",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    const cards = screen.getAllByTestId("meet-wall-card");
    expect(within(cards[0]).getByText("Featured recap")).toBeInTheDocument();
    expect(within(cards[0]).getAllByAltText("Meet wall post")).toHaveLength(2);
    expect(within(cards[1]).getByText("Normal post")).toBeInTheDocument();
  });

  it("renders an empty state when there are no wall items", () => {
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    expect(screen.getByText("Meet Feedback")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Comment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Photos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rate Meet" })).toBeInTheDocument();
    expect(screen.getByText("No wall posts yet.")).toBeInTheDocument();
  });

  it("opens the comment composer at the top of the wall when Add Comment is clicked", async () => {
    const user = userEvent.setup();

    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    await user.click(screen.getByRole("button", { name: "Add Comment" }));

    expect(screen.getByText("comment composer")).toBeInTheDocument();
  });

  it("opens the photo composer for Add Photos", async () => {
    const user = userEvent.setup();

    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    await user.click(screen.getByRole("button", { name: "Add Photos" }));
    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    const photo = new File(["photo-1"], "photo-1.jpg", {
      type: "image/jpeg",
    });
    await user.upload(input as HTMLInputElement, photo);

    expect(screen.getByText("photo composer")).toBeInTheDocument();
  });

  it("opens the rating composer for non-organisers", async () => {
    const user = userEvent.setup();

    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    await user.click(screen.getByRole("button", { name: "Rate Meet" }));

    expect(screen.getByText("rating composer")).toBeInTheDocument();
  });

  it("hides wall action buttons when there is no logged-in user and no attendee id", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    } as any);
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    expect(screen.getByText("Meet Feedback")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Comment" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Photos" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Rate Meet" }),
    ).not.toBeInTheDocument();
  });

  it("shows comment and photo actions for the organiser but hides rating", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "organizer-1" },
      isLoading: false,
      isAuthenticated: true,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    } as any);
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    expect(screen.getByRole("button", { name: "Add Comment" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Photos" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Rate Meet" }),
    ).not.toBeInTheDocument();
  });

  it("allows the organiser to mark a post as favourite", async () => {
    const user = userEvent.setup();
    updateWallItemFavouriteAsync.mockResolvedValue({
      wallItem: { id: "wall-1", favourite: 1 },
    });

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "organizer-1" },
      isLoading: false,
      isAuthenticated: true,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    } as any);
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          comment: "Worth featuring",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T08:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    await user.click(screen.getByRole("button", { name: "Favourite" }));

    expect(updateWallItemFavouriteAsync).toHaveBeenCalledWith({
      meetId: "meet-1",
      wallItemId: "wall-1",
      favourite: 1,
    });
  });

  it("allows the organiser to unmark a favourite post", async () => {
    const user = userEvent.setup();
    updateWallItemFavouriteAsync.mockResolvedValue({
      wallItem: { id: "wall-1", favourite: 0 },
    });

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "organizer-1" },
      isLoading: false,
      isAuthenticated: true,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    } as any);
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          comment: "Existing report",
          favourite: 2,
          likesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T08:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    await user.click(screen.getByRole("button", { name: "Favourite 2" }));

    expect(updateWallItemFavouriteAsync).toHaveBeenCalledWith({
      meetId: "meet-1",
      wallItemId: "wall-1",
      favourite: 0,
    });
  });

  it("routes like and dislike actions through the wall reaction callbacks", async () => {
    const user = userEvent.setup();
    const onLike = vi.fn();
    const onDislike = vi.fn();

    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          comment: "Great day on the mountain",
          favourite: 0,
          likesCount: 3,
          likedByMe: false,
          createdAt: "2026-04-29T08:00:00.000Z",
        },
        {
          id: "wall-2",
          meetId: "meet-1",
          comment: "Already liked",
          favourite: 0,
          likesCount: 1,
          likedByMe: true,
          createdAt: "2026-04-29T07:59:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(
      <MeetWall
        meetId="meet-1"
        onLike={onLike}
        onDislike={onDislike}
      />,
    );

    await user.click(screen.getByRole("button", { name: "3 likes" }));
    await user.click(screen.getAllByRole("button", { name: "Dislike" })[1]);

    expect(onLike).toHaveBeenCalledWith(
      expect.objectContaining({ id: "wall-1" }),
    );
    expect(onDislike).toHaveBeenCalledWith(
      expect.objectContaining({ id: "wall-2" }),
    );
  });

  it("shows like and dislike controls for logged-in users and updates reactions", async () => {
    const user = userEvent.setup();
    updateWallItemReactionAsync.mockResolvedValue({
      wallItem: { id: "wall-1", myReaction: "like" },
    });

    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          comment: "React to this",
          favourite: 0,
          likesCount: 0,
          dislikesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T08:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    await user.click(screen.getByRole("button", { name: "Like" }));
    await user.click(screen.getByRole("button", { name: "Dislike" }));

    expect(updateWallItemReactionAsync).toHaveBeenNthCalledWith(1, {
      meetId: "meet-1",
      wallItemId: "wall-1",
      reaction: "like",
      attendeeId: undefined,
    });
    expect(updateWallItemReactionAsync).toHaveBeenNthCalledWith(2, {
      meetId: "meet-1",
      wallItemId: "wall-1",
      reaction: "dislike",
      attendeeId: undefined,
    });
  });

  it("shows like and dislike controls for attendee-link users and includes attendeeId", async () => {
    const user = userEvent.setup();
    updateWallItemReactionAsync.mockResolvedValue({
      wallItem: { id: "wall-1", myReaction: "like" },
    });

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      meUpdatedAt: 0,
      refreshSession: vi.fn(),
      logout: vi.fn(),
    } as any);
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          comment: "React to this",
          favourite: 0,
          likesCount: 0,
          dislikesCount: 0,
          likedByMe: false,
          createdAt: "2026-04-29T08:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" attendeeId="attendee-1" />);

    await user.click(screen.getByRole("button", { name: "Like" }));
    await user.click(screen.getByRole("button", { name: "Dislike" }));

    expect(updateWallItemReactionAsync).toHaveBeenNthCalledWith(1, {
      meetId: "meet-1",
      wallItemId: "wall-1",
      reaction: "like",
      attendeeId: "attendee-1",
    });
    expect(updateWallItemReactionAsync).toHaveBeenNthCalledWith(2, {
      meetId: "meet-1",
      wallItemId: "wall-1",
      reaction: "dislike",
      attendeeId: "attendee-1",
    });
  });

  it("renders consecutive photo posts inside the same wall card", () => {
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          attendeeId: "attendee-1",
          url: "https://cdn.example.com/photo-1.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T08:00:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "O",
        },
        {
          id: "wall-2",
          meetId: "meet-1",
          attendeeId: "attendee-1",
          url: "https://cdn.example.com/photo-2.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T07:59:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "W",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    expect(screen.getAllByAltText("Meet wall post")).toHaveLength(2);
    expect(screen.getAllByTestId("meet-wall-card")).toHaveLength(1);
  });

  it("renders consecutive photo posts from different attendees in separate wall cards", () => {
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          attendeeId: "attendee-1",
          url: "https://cdn.example.com/photo-1.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T08:00:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "O",
        },
        {
          id: "wall-2",
          meetId: "meet-1",
          attendeeId: "attendee-2",
          url: "https://cdn.example.com/photo-2.jpg",
          authorName: "Bob",
          createdAt: "2026-04-29T07:59:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "W",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    expect(screen.getAllByAltText("Meet wall post")).toHaveLength(2);
    expect(screen.getAllByTestId("meet-wall-card")).toHaveLength(2);
  });

  it("renders five grouped photos without hiding any behind a placeholder", () => {
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-1.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T08:00:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "O",
        },
        {
          id: "wall-2",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-2.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T07:59:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "W",
        },
        {
          id: "wall-3",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-3.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T07:58:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "P",
        },
        {
          id: "wall-4",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-4.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T07:57:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "S",
        },
        {
          id: "wall-5",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-5.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T07:56:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "O",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    expect(screen.getAllByAltText("Meet wall post")).toHaveLength(5);
    expect(screen.queryByText(/\+\d+/)).not.toBeInTheDocument();
  });

  it("shows a +N placeholder when a grouped photo card has more than six photos", () => {
    vi.mocked(useFetchMeetWall).mockReturnValue({
      data: [
        {
          id: "wall-1",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-1.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T08:00:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "O",
        },
        {
          id: "wall-2",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-2.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T07:59:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "W",
        },
        {
          id: "wall-3",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-3.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T07:58:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "P",
        },
        {
          id: "wall-4",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-4.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T07:57:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "S",
        },
        {
          id: "wall-5",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-5.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T07:56:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "O",
        },
        {
          id: "wall-6",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-6.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T07:55:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "W",
        },
        {
          id: "wall-7",
          meetId: "meet-1",
          url: "https://cdn.example.com/photo-7.jpg",
          authorName: "Alice",
          createdAt: "2026-04-29T07:54:00.000Z",
          favourite: 0,
          likesCount: 0,
          likedByMe: false,
          aspect: "P",
        },
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<MeetWall meetId="meet-1" />);

    expect(screen.getAllByAltText("Meet wall post")).toHaveLength(5);
    expect(screen.getByText("+2")).toBeInTheDocument();
  });
});
