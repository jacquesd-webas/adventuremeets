import { Client } from "minio";

export function createS3Client() {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKey = process.env.S3_ACCESS_KEY_ID;
  const secretKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error("S3-compatible object storage is not configured");
  }

  let endpointUrl: URL;
  try {
    endpointUrl = new URL(endpoint);
  } catch {
    throw new Error("S3_ENDPOINT must be an absolute URL");
  }

  if (
    !["http:", "https:"].includes(endpointUrl.protocol) ||
    endpointUrl.pathname !== "/" ||
    endpointUrl.search ||
    endpointUrl.hash
  ) {
    throw new Error(
      "S3_ENDPOINT must be an HTTP(S) origin without a path, query, or fragment",
    );
  }

  return new Client({
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
}
