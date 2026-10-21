import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface StorageConfigStatus {
  provider: 'local_secure_fs' | 's3' | 'r2';
  isExternalConfigured: boolean;
  publicMediaBaseUrl: string;
  privateDocumentStoragePath: string;
  maxPhotoSizeBytes: number;
  maxDocumentSizeBytes: number;
  allowedPhotoMimeTypes: string[];
  allowedDocumentMimeTypes: string[];
}

export interface StoredFileResult {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSizeBytes: number;
  url: string;
  sha256Hash: string;
  isPrivate: boolean;
  storedAt: string;
}

const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_PHOTO_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOC_MIMES = ['application/pdf', 'image/jpeg', 'image/png'];

// Local filesystem directories for storage
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const PHOTOS_DIR = path.join(UPLOADS_DIR, 'photos');
const DOCUMENTS_DIR = path.join(UPLOADS_DIR, 'documents');

// Ensure local directories exist
try {
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  }
  if (!fs.existsSync(DOCUMENTS_DIR)) {
    fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
  }
} catch (e) {
  // Graceful fallback
}

export function getStorageConfigStatus(): StorageConfigStatus {
  const hasS3 = Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID);
  const hasR2 = Boolean(process.env.R2_BUCKET && process.env.R2_ACCOUNT_ID);

  return {
    provider: hasS3 ? 's3' : hasR2 ? 'r2' : 'local_secure_fs',
    isExternalConfigured: hasS3 || hasR2,
    publicMediaBaseUrl: '/uploads/photos',
    privateDocumentStoragePath: DOCUMENTS_DIR,
    maxPhotoSizeBytes: MAX_PHOTO_SIZE,
    maxDocumentSizeBytes: MAX_DOC_SIZE,
    allowedPhotoMimeTypes: ALLOWED_PHOTO_MIMES,
    allowedDocumentMimeTypes: ALLOWED_DOC_MIMES,
  };
}

/**
 * Validates, calculates SHA-256 hash, and stores genuine property photo or document.
 */
export async function storeUploadedFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  isPrivate: boolean
): Promise<{ success: boolean; result?: StoredFileResult; error?: string }> {
  // 1. Validate MIME type
  const allowedMimes = isPrivate ? ALLOWED_DOC_MIMES : ALLOWED_PHOTO_MIMES;
  if (!allowedMimes.includes(mimeType.toLowerCase())) {
    return {
      success: false,
      error: `Unsupported file format '${mimeType}'. Allowed formats: ${allowedMimes.map((m) => m.split('/')[1].toUpperCase()).join(', ')}.`,
    };
  }

  // 2. Validate file size
  const maxSize = isPrivate ? MAX_DOC_SIZE : MAX_PHOTO_SIZE;
  if (buffer.length > maxSize) {
    const maxMb = maxSize / (1024 * 1024);
    return {
      success: false,
      error: `File size exceeds the permitted limit of ${maxMb}MB.`,
    };
  }

  // 3. Compute SHA-256 digest
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  // 4. Generate safe unique filename
  const ext = path.extname(originalName).toLowerCase() || (mimeType.includes('pdf') ? '.pdf' : '.jpg');
  const fileId = `${isPrivate ? 'doc' : 'img'}_${crypto.randomUUID().slice(0, 12)}`;
  const safeFilename = `${fileId}${ext}`;

  // 5. Write to secure storage target
  const targetDir = isPrivate ? DOCUMENTS_DIR : PHOTOS_DIR;
  const targetPath = path.join(targetDir, safeFilename);

  try {
    fs.writeFileSync(targetPath, buffer);
  } catch (err) {
    console.error('Failed to write uploaded file to disk:', err);
    return {
      success: false,
      error: 'Storage write failure. Please check disk permissions or cloud storage settings.',
    };
  }

  // 6. Return metadata
  // Public photos have direct URL path; private documents have an internal access token or reference only
  const url = isPrivate
    ? `/api/properties/documents/download/${fileId}`
    : `/uploads/photos/${safeFilename}`;

  return {
    success: true,
    result: {
      id: fileId,
      filename: safeFilename,
      originalName: path.basename(originalName),
      mimeType,
      fileSizeBytes: buffer.length,
      url,
      sha256Hash: hash,
      isPrivate,
      storedAt: new Date().toISOString(),
    },
  };
}
