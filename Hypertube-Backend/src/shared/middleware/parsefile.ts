
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configure multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory

// File filter to allow only images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Export the upload middleware with proper type annotations
export const uploadSingle = (fieldName: string): ((req: Request, res: Response, next: NextFunction) => void) => 
  upload.single(fieldName);

export const uploadMultiple = (fieldName: string, maxCount: number): ((req: Request, res: Response, next: NextFunction) => void) => 
  upload.array(fieldName, maxCount);

export default upload;