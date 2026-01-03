/**
 * Unified upload utility using R2 direct upload (presigned URL)
 *
 * Benefits:
 * - Bypasses Vercel 4.5MB limit
 * - Supports up to 20MB for images, 50MB for audio
 * - Faster (no intermediate proxy)
 * - Saves Vercel bandwidth
 */

import { IMAGE_CACHE_CONTROL } from "@/lib/cache-control";

const AUDIO_CACHE_CONTROL = "public, max-age=31536000, immutable";

export interface UploadResult {
  url: string;
  key: string;
}

export interface UploadError extends Error {
  code?: string;
}

/**
 * Upload image to R2 using presigned URL
 * @param file - Image file to upload
 * @returns Public URL of uploaded file
 * @throws UploadError if upload fails
 */
export async function uploadImageToR2(file: File): Promise<string> {
  // 1. Request presigned URL from server
  const presignResponse = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });

  const presignResult = await presignResponse.json();

  if (presignResult.code !== 0) {
    const error = new Error(presignResult.message || "Failed to get upload URL") as UploadError;
    error.code = "PRESIGN_FAILED";
    throw error;
  }

  const { presignedUrl, publicUrl } = presignResult.data;

  // 2. Direct upload to R2
  const uploadResponse = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
      "Cache-Control": IMAGE_CACHE_CONTROL,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const error = new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`) as UploadError;
    error.code = "UPLOAD_FAILED";
    throw error;
  }

  return publicUrl;
}

/**
 * Upload multiple images in parallel
 * @param files - Array of image files
 * @returns Array of public URLs (same order as input)
 */
export async function uploadMultipleImagesToR2(files: File[]): Promise<string[]> {
  const results = await Promise.allSettled(
    files.map(file => uploadImageToR2(file))
  );

  // Extract successful uploads, throw if any failed
  const urls: string[] = [];
  const errors: Error[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      urls.push(result.value);
    } else {
      errors.push(new Error(`File ${files[index].name}: ${result.reason.message}`));
    }
  });

  // If any upload failed, throw with details
  if (errors.length > 0) {
    throw new Error(`${errors.length} of ${files.length} uploads failed:\n${errors.map(e => e.message).join('\n')}`);
  }

  return urls;
}

/**
 * Upload audio to R2 using presigned URL
 * @param file - Audio file to upload
 * @param onProgress - Optional progress callback (0-100)
 * @returns Public URL of uploaded file
 * @throws UploadError if upload fails
 */
export async function uploadAudioToR2(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // 1. Request presigned URL from server
  const presignResponse = await fetch("/api/upload/audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });

  const presignResult = await presignResponse.json();

  if (presignResult.code !== 0) {
    const error = new Error(presignResult.message || "Failed to get upload URL") as UploadError;
    error.code = "PRESIGN_FAILED";
    throw error;
  }

  const { presignedUrl, publicUrl } = presignResult.data;

  // 2. Direct upload to R2 with progress tracking
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      });
    }

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(publicUrl);
      } else {
        const error = new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`) as UploadError;
        error.code = "UPLOAD_FAILED";
        reject(error);
      }
    });

    xhr.addEventListener("error", () => {
      const error = new Error("Network error during upload") as UploadError;
      error.code = "NETWORK_ERROR";
      reject(error);
    });

    xhr.addEventListener("abort", () => {
      const error = new Error("Upload aborted") as UploadError;
      error.code = "UPLOAD_ABORTED";
      reject(error);
    });

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("Cache-Control", AUDIO_CACHE_CONTROL);
    xhr.send(file);
  });
}
