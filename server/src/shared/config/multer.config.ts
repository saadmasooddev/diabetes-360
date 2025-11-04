import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../errors';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

interface MulterConfigOptions {
  destination: string; 
  fieldName?: string; 
  maxFileSize?: number; 
  allowedMimeTypes?: string[]; 
}

export function createMulterConfig(options: MulterConfigOptions) {
  const {
    destination,
    fieldName = 'image',
    maxFileSize = MAX_FILE_SIZE,
    allowedMimeTypes = ALLOWED_IMAGE_TYPES,
  } = options;

  // Storage configuration
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      const uploadPath = path.join(process.cwd(), destination);
      
      try {
        // Check if directory exists, create if not
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      } catch (err) {
        cb(err as Error, uploadPath);
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${baseName}_${timestamp}_${randomStr}${ext}`;
      cb(null, filename);
    },
  });

  const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestError(
          `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
        )
      );
    }
  };

  // Configure multer
  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: 1, // Only allow single file upload
    },
  });

  // Return single file upload middleware
  return upload.single(fieldName);
}

export function createMulterConfigMultiple(
  options: MulterConfigOptions,
  maxCount: number = 5
) {
  const {
    destination,
    fieldName = 'images',
    maxFileSize = MAX_FILE_SIZE,
    allowedMimeTypes = ALLOWED_IMAGE_TYPES,
  } = options;

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), destination);
      
      try {
        // Check if directory exists, create if not
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      } catch (err) {
        cb(err as Error, uploadPath);
      }
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 15);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${baseName}_${timestamp}_${randomStr}${ext}`;
      cb(null, filename);
    },
  });

  const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestError(
          `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
        )
      );
    }
  };

  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: maxCount,
    },
  });

  return upload.array(fieldName, maxCount);
}

export const MULTER_CONSTANTS = {
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
};

