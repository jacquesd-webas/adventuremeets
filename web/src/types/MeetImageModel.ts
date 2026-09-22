export type MeetImage = {
  id: string;
  meetId: string;
  url: string;
  isPrimary: boolean;
  aspect: "W" | "S" | "P" | "O";
  objectKey?: string;
  contentType?: string;
  sizeBytes?: number;
  createdAt?: string;
};

export default MeetImage;
