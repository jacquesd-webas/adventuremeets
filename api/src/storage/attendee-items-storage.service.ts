import { Injectable } from "@nestjs/common";
import { Client } from "minio";

@Injectable()
export class AttendeeItemsStorageService {
  private readonly client: Client;
  private readonly bucket =
    process.env.MINIO_ATTENDEE_ITEMS_BUCKET || "attendee-items";
  private bucketReady = false;

  constructor() {
    const endPoint = process.env.MINIO_ENDPOINT;
    const accessKey = process.env.MINIO_ROOT_USER;
    const secretKey = process.env.MINIO_ROOT_PASSWORD;
    if (!endPoint || !accessKey || !secretKey) {
      throw new Error("MinIO is not configured");
    }
    this.client = new Client({
      endPoint,
      port: Number(process.env.MINIO_PORT || 9000),
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey,
      secretKey,
    });
  }

  async upload(objectKey: string, buffer: Buffer): Promise<void> {
    await this.ensureBucket();
    await this.client.putObject(this.bucket, objectKey, buffer, buffer.length, {
      "Content-Type": "application/pdf",
    });
  }

  async remove(objectKey: string): Promise<void> {
    await this.client.removeObject(this.bucket, objectKey);
  }

  async download(objectKey: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, objectKey);
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > 10 * 1024 * 1024) {
        stream.destroy();
        throw new Error("Stored indemnity PDF exceeds the 10 MB limit");
      }
      chunks.push(buffer);
    }
    return Buffer.concat(chunks);
  }

  private async ensureBucket(): Promise<void> {
    if (this.bucketReady) return;
    if (!(await this.client.bucketExists(this.bucket))) {
      await this.client.makeBucket(this.bucket);
    }
    // The attendee bucket has no public-read policy. Access will be authorised by the API.
    this.bucketReady = true;
  }
}
