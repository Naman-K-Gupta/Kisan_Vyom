import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { ENV } from '../utils/env';
import { logger } from '../utils/logger';

// Setup local uploads directory
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Cloudinary if keys exist
const isCloudinaryConfigured = Boolean(
  ENV.CLOUDINARY_CLOUD_NAME && ENV.CLOUDINARY_API_KEY && ENV.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
    api_key: ENV.CLOUDINARY_API_KEY,
    api_secret: ENV.CLOUDINARY_API_SECRET,
  });
  logger.info('Cloudinary initialized for cloud image storage');
} else {
  logger.info('Using local disk storage for image uploads (/uploads)');
}

// Disk Storage configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter (Only JPG, JPEG, PNG, WebP)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only JPG, JPEG, PNG, and WebP images are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter,
});

export async function processUploadedFile(file: Express.Multer.File): Promise<string> {
  if (isCloudinaryConfigured) {
    try {
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: 'smart-farmer',
        resource_type: 'image',
      });
      // Delete temporary local file after successful upload to cloud
      fs.unlink(file.path, () => {});
      return uploadResult.secure_url;
    } catch (err: any) {
      logger.error('Cloudinary upload failed, falling back to local URL:', err.message);
    }
  }

  // Local storage public URL
  return `/uploads/${file.filename}`;
}
