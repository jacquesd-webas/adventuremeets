import { BadRequestException, Injectable } from "@nestjs/common";
import { Client } from "minio";

@Injectable()
export class ObjectStorageService {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKey = process.env.S3_ACCESS_KEY_ID;
    const secretKey = process.env.S3_SECRET_ACCESS_KEY;
    const bucket = process.env.S3_BUCKET || "meet-images";
    const publicUrl = process.env.S3_PUBLIC_URL;

    if (!endpoint || !accessKey || !secretKey || !publicUrl) {
      throw new Error("S3-compatible object storage is not configured");
    }

    let endpointUrl: URL;
    try {
      endpointUrl = new URL(endpoint);
    } catch {
      throw new Error("S3_ENDPOINT must be an absolute URL");
    }

    if (
      endpointUrl.pathname !== "/" ||
      endpointUrl.search ||
      endpointUrl.hash
    ) {
      throw new Error(
        "S3_ENDPOINT must not include a path, query, or fragment",
      );
    }

    this.client = new Client({
      endPoint: endpointUrl.hostname,
      port: endpointUrl.port
        ? Number(endpointUrl.port)
        : endpointUrl.protocol === "https:"
          ? 443
          : 80,
      useSSL: endpointUrl.protocol === "https:",
      accessKey,
      secretKey,
      region: process.env.S3_REGION || undefined,
      pathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
    });
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
