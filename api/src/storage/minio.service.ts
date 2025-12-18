import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Client } from 'minio';

@Injectable()
export class MinioService {
  private readonly client: Client;
  private readonly bucket: string;
  private readonly publicUrl: string;
  private bucketReady = false;

  constructor() {
    const endPoint = process.env.MINIO_ENDPOINT;
    const port = Number(process.env.MINIO_PORT || 9000);
    const accessKey = process.env.MINIO_ACCESS_KEY;
    const secretKey = process.env.MINIO_SECRET_KEY;
    const useSSL = process.env.MINIO_USE_SSL === 'true';
    const bucket = process.env.MINIO_BUCKET || 'meet-images';
    const publicUrl =
      process.env.MINIO_PUBLIC_URL ||
      `${useSSL ? 'https' : 'http'}://${endPoint}${port ? `:${port}` : ''}`;

    if (!endPoint || !accessKey || !secretKey) {
      throw new UnauthorizedException('MinIO is not configured');
    }

    this.client = new Client({ endPoint, port, useSSL, accessKey, secretKey });
    this.bucket = bucket;
    this.publicUrl = publicUrl.replace(/\/+$/, '');
  }

  async upload(objectKey: string, buffer: Buffer, contentType: string) {
    await this.ensureBucket();
    await this.client.putObject(this.bucket, objectKey, buffer, {
      'Content-Type': contentType
    });
    return {
      objectKey,
      url: `${this.publicUrl}/${this.bucket}/${objectKey}`
    };
  }

  private async ensureBucket() {
    if (this.bucketReady) return;
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
    }
    this.bucketReady = true;
  }
}
