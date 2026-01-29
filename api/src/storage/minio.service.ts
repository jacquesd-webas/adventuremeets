import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Client } from "minio";

@Injectable()
export class MinioService {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private bucketReady = false;

  constructor() {
    const endPoint = process.env.MINIO_ENDPOINT;
    const port = Number(process.env.MINIO_PORT || 9000);
    const accessKey = process.env.MINIO_ROOT_USER;
    const secretKey = process.env.MINIO_ROOT_PASSWORD;
    const useSSL = process.env.MINIO_USE_SSL === "true";
    const bucket = process.env.MINIO_BUCKET || "meet-images";
    const publicUrl =
      process.env.MINIO_PUBLIC_URL ||
      `${useSSL ? "https" : "http"}://${endPoint}${port ? `:${port}` : ""}`;

    if (!endPoint || !accessKey || !secretKey) {
      throw new UnauthorizedException("MinIO is not configured");
    }

    this.client = new Client({ endPoint, port, useSSL, accessKey, secretKey });
    this.bucket = bucket;
    this.publicUrl = publicUrl.replace(/\/+$/, "");
  }

  async upload(objectKey: string, buffer: Buffer, contentType: string) {
    try {
      await this.ensureBucket();
      await this.client.putObject(
        this.bucket,
        objectKey,
        buffer,
        buffer.length,
        {
          "Content-Type": contentType || "application/octet-stream",
        }
      );
      return {
        objectKey,
        url: `${this.publicUrl}/${this.bucket}/${objectKey}`,
      };
    } catch (error: any) {
      const message = error?.message || "Failed to upload object";
      throw new BadRequestException(message);
    }
  }

  private async ensureBucket() {
    if (this.bucketReady) return;
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
    // Ensure public read for objects
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    };
    await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
    this.bucketReady = true;
  }
}
