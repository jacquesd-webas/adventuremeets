import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Client } from "minio";
import { createS3Client } from "./s3-client";

export function imageUrlFor(objectKey?: string | null): string | undefined {
  if (!objectKey) return undefined;
  const apiBaseUrl = (process.env.API_BASEURL || "http://localhost:8000")
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/, "");
  return `${apiBaseUrl}/api/v1/storage/images?key=${encodeURIComponent(objectKey)}`;
}

@Injectable()
export class ObjectStorageService {
  private readonly client: Client;
  private readonly bucket: string;

  constructor() {
    const bucket = process.env.S3_BUCKET || "meet-images";
    this.client = createS3Client();
    this.bucket = bucket;
  }

  async upload(objectKey: string, buffer: Buffer, contentType: string) {
    try {
      await this.client.putObject(
        this.bucket,
        objectKey,
        buffer,
        buffer.length,
        {
          "Content-Type": contentType || "application/octet-stream",
        },
      );
      return { objectKey, url: imageUrlFor(objectKey)! };
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || "Failed to upload object",
      );
    }
  }

  async remove(objectKey: string) {
    try {
      await this.client.removeObject(this.bucket, objectKey);
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || "Failed to remove object",
      );
    }
  }

  async getImage(objectKey: string) {
    if (
      !/^(meets|wall|logos|avatars)\/[^?&#]+$/.test(objectKey) ||
      objectKey.split("/").includes("..")
    ) {
      throw new NotFoundException("Image not found");
    }

    try {
      const stat = await this.client.statObject(this.bucket, objectKey);
      const contentType = stat.metaData?.["content-type"];
      if (!contentType?.startsWith("image/")) {
        throw new NotFoundException("Image not found");
      }
      const stream = await this.client.getObject(this.bucket, objectKey);
      return { stream, contentType, size: stat.size };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error?.code === "NoSuchKey" ||
        error?.code === "NotFound"
      ) {
        throw new NotFoundException("Image not found");
      }
      throw error;
    }
  }
}
