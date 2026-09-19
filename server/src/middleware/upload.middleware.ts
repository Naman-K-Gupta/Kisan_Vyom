import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
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
  logger.info('Using database base64 storage for image uploads with disk fallback');
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

/**
 * Flexible photo upload middleware that accepts either 'picture' or 'photo' field names.
 */
export const uploadProfilePhotoMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.fields([
    { name: 'picture', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      req.file = files.picture?.[0] || files.photo?.[0];
    }
    next();
  });
};

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
      logger.error('Cloudinary upload failed, falling back to database base64:', err.message);
    }
  }

  // Persistent Database Storage:
  // Convert image to a persistent Base64 Data URL directly stored in Prisma / Database.
  // This guarantees the image survives container restarts, dyno idling, and server redeployments.
  try {
    const fileBuffer = file.buffer || (file.path && fs.existsSync(file.path) ? fs.readFileSync(file.path) : null);
    if (fileBuffer) {
      const mime = file.mimetype || 'image/jpeg';
      const base64Data = fileBuffer.toString('base64');
      const dataUrl = `data:${mime};base64,${base64Data}`;

      // Clean up temporary disk file if one was created
      if (file.path && fs.existsSync(file.path)) {
        fs.unlink(file.path, () => {});
      }
      return dataUrl;
    }
  } catch (convErr: any) {
    logger.error('Failed to convert uploaded file to Base64 Data URL:', convErr.message);
  }

  // Fallback to local storage public URL if conversion failed
  return `/uploads/${file.filename}`;
}
