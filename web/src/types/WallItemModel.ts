export type WallItem = {
  id: string;
  meetId: string;
  createdBy?: string;
  attendeeId?: string | null;
  authorName?: string;
  comment?: string;
  stars?: number;
  url?: string;
  aspect?: "W" | "S" | "P" | "O";
  objectKey?: string;
  contentType?: string;
  sizeBytes?: number;
  favourite: number;
  likesCount: number;
  dislikesCount: number;
  heartsCount: number;
  likedByMe: boolean;
  myReaction?: "like" | "dislike" | "heart";
  createdAt?: string;
};

export default WallItem;
