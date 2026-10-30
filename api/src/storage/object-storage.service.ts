import { BadRequestException, Injectable } from "@nestjs/common";
import { Client } from "minio";
import { createS3Client } from "./s3-client";

@Injectable()
export class ObjectStorageService {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    const bucket = process.env.S3_BUCKET || "meet-images";
    const publicUrl = process.env.S3_PUBLIC_URL;

    if (!publicUrl) {
      throw new Error("S3-compatible object storage is not configured");
    }

    this.client = createS3Client();
    this.bucket = bucket;
    this.publicUrl = publicUrl.replace(/\/+$/, "");
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
      return { objectKey, url: this.getPublicUrl(objectKey) };
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

  private getPublicUrl(objectKey: string) {
    return `${this.publicUrl}/${objectKey.replace(/^\/+/, "")}`;
  }
}
