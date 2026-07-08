import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { useAuth } from "../../context/authContext";
import { useDeleteWallItem } from "../../hooks/useDeleteWallItem";
import { formatFriendlyTimestamp } from "../../helpers/formatFriendlyTimestamp";
import { useNotistack } from "../../hooks/useNotistack";
import { useUpdateWallItemComment } from "../../hooks/useUpdateWallItemComment";
import { WallItem } from "../../types/WallItemModel";
import { MeetComment } from "./MeetComment";
import { MeetWallFavourite } from "./MeetWallFavourite";
import { MeetWallLike } from "./MeetWallLike";
import { MeetWallCommentEditor } from "./MeetWallCommentEditor";
import { MeetPhotos } from "./MeetPhotos";
import { MeetRating } from "./MeetRating";

type MeetWallCardProps = {
  meetId: string;
  attendeeId?: string;
  groupKey: string;
  primaryItem: WallItem;
  photoItems: WallItem[];
  onPhotoClick: (item: WallItem) => void;
  onFavourite?: (item: WallItem) => void;
  onLike?: (item: WallItem) => void;
  onDislike?: (item: WallItem) => void;
};

export function MeetWallCard({
  meetId,
  attendeeId,
  groupKey,
  primaryItem,
  photoItems,
  onPhotoClick,
  onFavourite,
  onLike,
  onDislike,
}: MeetWallCardProps) {
  const { user } = useAuth();
  const notice = useNotistack();
  const { updateWallItemCommentAsync, isLoading: isSavingComment } =
    useUpdateWallItemComment();
  const { deleteWallItemAsync, isLoading: isDeletingWallItem } =
    useDeleteWallItem();
  const [isEditingComment, setIsEditingComment] = useState(false);
  const showFavouriteOnPanel = !(primaryItem.url && photoItems.length > 1);
  const usesFeaturedFavouriteLayout = !primaryItem.url && photoItems.length > 0;
  const featuredPhoto = usesFeaturedFavouriteLayout ? photoItems[0] : null;
  const featuredPhotoThumbnails = usesFeaturedFavouriteLayout
    ? photoItems.slice(1)
    : [];
  const canEditComment = Boolean(
    primaryItem.comment &&
      ((user?.id && primaryItem.createdBy === user.id) ||
        (attendeeId && primaryItem.attendeeId === attendeeId)),
  );
  const canDeleteWallItem =
    (Boolean(user?.id) && primaryItem.createdBy === user?.id) ||
    (Boolean(attendeeId) && primaryItem.attendeeId === attendeeId);

  const handleSaveComment = async (comment: string) => {
    try {
      await updateWallItemCommentAsync({
        meetId,
        wallItemId: primaryItem.id,
        comment,
        attendeeId,
      });
      notice.success("Comment updated");
      setIsEditingComment(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update comment";
      notice.error(message);
    }
  };

  const handleDeleteWallItem = async () => {
    try {
      await deleteWallItemAsync({
        meetId,
        wallItemId: primaryItem.id,
        attendeeId,
      });
      notice.success("Post deleted");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete post";
      notice.error(message);
    }
  };

  return (
    <Box
      key={groupKey}
      data-testid="meet-wall-card"
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "background.paper",
      }}
    >
      {featuredPhoto ? (
        <Stack spacing={1.25} sx={{ pt: 2, px: 2 }}>
          <Box
            component="button"
            type="button"
            onClick={() => onPhotoClick(featuredPhoto)}
            sx={{
              width: "100%",
              display: "block",
              p: 0,
              border: 0,
              background: "none",
              cursor: "pointer",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Box
              component="img"
              src={featuredPhoto.url}
              alt="Meet wall post"
              sx={{
                width: "100%",
                maxHeight: 360,
                display: "block",
                objectFit: "cover",
                borderRadius: 2,
                backgroundColor: "grey.100",
              }}
            />
          </Box>
        </Stack>
      ) : photoItems.length > 0 ? (
        <Stack alignItems="center" sx={{ pt: 2, px: 2 }}>
          <MeetPhotos photoItems={photoItems} onPhotoClick={onPhotoClick} />
        </Stack>
      ) : null}
      <Stack spacing={1.25} sx={{ p: 2 }}>
        <MeetRating stars={primaryItem.stars} />
        {isEditingComment && primaryItem.comment ? (
          <MeetWallCommentEditor
            initialComment={primaryItem.comment}
            isSaving={isSavingComment}
            onCancel={() => {
              setIsEditingComment(false);
            }}
            onSave={handleSaveComment}
          />
        ) : (
          <MeetComment comment={primaryItem.comment} />
        )}
        {primaryItem.createdAt ||
        canEditComment ||
        canDeleteWallItem ||
        (showFavouriteOnPanel && primaryItem.favourite > 0) ||
        primaryItem.likesCount > 0 ||
        (showFavouriteOnPanel && onFavourite) ||
        onLike ||
        onDislike ? (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
          >
            {primaryItem.createdAt || primaryItem.likesCount > 0 || onLike || onDislike ? (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
              >
                {primaryItem.createdAt ? (
                  <Typography variant="caption" color="text.secondary">
                    {`${formatFriendlyTimestamp(primaryItem.createdAt)}${
                      primaryItem.authorName ? ` by ${primaryItem.authorName}` : ""
                    }`}
                  </Typography>
                ) : null}
                <MeetWallLike
                  item={primaryItem}
                  onLike={onLike}
                  onDislike={onDislike}
                />
              </Stack>
            ) : (
              <span />
            )}
            <Stack direction="row" spacing={0.5} alignItems="center">
              {canEditComment && !isEditingComment ? (
                <Tooltip title="Edit comment">
                  <IconButton
                    size="small"
                    aria-label="Edit comment"
                    onClick={() => {
                      setIsEditingComment(true);
                    }}
                  >
                    <EditOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null}
              {canDeleteWallItem ? (
                <Tooltip title="Delete post">
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Delete post"
                      onClick={() => {
                        void handleDeleteWallItem();
                      }}
                      disabled={isDeletingWallItem}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              ) : null}
              {showFavouriteOnPanel ? (
                <MeetWallFavourite item={primaryItem} onFavourite={onFavourite} />
              ) : null}
            </Stack>
          </Stack>
        ) : null}
        {featuredPhotoThumbnails.length > 0 ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              overflowX: "auto",
              overflowY: "hidden",
              pt: 0.5,
              pb: 0.25,
            }}
          >
            {featuredPhotoThumbnails.map((photoItem) => (
              <Box
                key={photoItem.id}
                component="button"
                type="button"
                onClick={() => onPhotoClick(photoItem)}
                sx={{
                  width: 92,
                  height: 68,
                  flexShrink: 0,
                  display: "block",
                  p: 0,
                  border: 0,
                  background: "none",
                  cursor: "pointer",
                  borderRadius: 1.5,
                  overflow: "hidden",
                }}
              >
                <Box
                  component="img"
                  src={photoItem.url}
                  alt="Meet wall post"
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "cover",
                    borderRadius: 1.5,
                    backgroundColor: "grey.100",
                  }}
                />
              </Box>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
}

export default MeetWallCard;
