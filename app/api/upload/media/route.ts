import { auth } from "@/auth";
import { IMAGE_CACHE_CONTROL } from "@/lib/cache-control";
import { respData, respErr } from "@/lib/resp";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const MEDIA_CACHE_CONTROL = "public, max-age=31536000, immutable";

const ALLOWED_MEDIA_TYPES = {
  image: {
    maxSize: 30 * 1024 * 1024,
    folder: "images",
    mimeTypes: [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/bmp",
      "image/tiff",
      "image/gif",
    ],
  },
  video: {
    maxSize: 100 * 1024 * 1024,
    folder: "videos",
    mimeTypes: ["video/mp4", "video/quicktime"],
  },
  audio: {
    maxSize: 50 * 1024 * 1024,
    folder: "audio",
    mimeTypes: ["audio/mpeg", "audio/wav", "audio/x-wav"],
  },
} satisfies Record<string, { maxSize: number; folder: string; mimeTypes: string[] }>;

const MEDIA_TYPE_ERROR_MESSAGE =
  "Unsupported file type. Supported formats: JPEG, PNG, WEBP, BMP, TIFF, GIF, MP4, MOV, MP3, WAV.";

function getMediaConfig(contentType: string) {
  const normalizedContentType = contentType.trim().toLowerCase();

  for (const config of Object.values(ALLOWED_MEDIA_TYPES)) {
    if (config.mimeTypes.includes(normalizedContentType)) {
      return config;
    }
  }

  return null;
}

function getS3Client() {
  return new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT || "",
    region: process.env.STORAGE_REGION || "auto",
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY || "",
      secretAccessKey: process.env.STORAGE_SECRET_KEY || "",
    },
  });
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    const body = await req.json();
    const { filename, contentType, fileSize } = body;

    if (!filename || !contentType) {
      return respErr("Missing filename or contentType");
    }

    const mediaConfig = getMediaConfig(contentType);
    if (!mediaConfig) {
      return respErr(MEDIA_TYPE_ERROR_MESSAGE);
    }

    if (fileSize && fileSize > mediaConfig.maxSize) {
      const maxMB = Math.round(mediaConfig.maxSize / 1024 / 1024);
      return respErr(`File size cannot exceed ${maxMB}MB`);
    }

    const timestamp = Date.now();
    const extension = filename.split(".").pop() || "bin";
    const key = `uploads/${mediaConfig.folder}/${session.user.uuid}/${timestamp}.${extension}`;

    const bucket = process.env.STORAGE_BUCKET || "";
    if (!bucket) {
      return respErr("Storage bucket not configured");
    }

    const s3Client = getS3Client();
    const cacheControl = contentType.startsWith("image/")
      ? IMAGE_CACHE_CONTROL
      : MEDIA_CACHE_CONTROL;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: cacheControl,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 600,
    });

    const publicUrl = process.env.STORAGE_DOMAIN
      ? `${process.env.STORAGE_DOMAIN}/${key}`
      : `${process.env.STORAGE_ENDPOINT}/${bucket}/${key}`;

    return respData({
      presignedUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("Failed to generate media presigned URL:", error);
    return respErr(
      error instanceof Error ? error.message : "Failed to generate upload URL"
    );
  }
}
