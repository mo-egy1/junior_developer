// src/index.ts

import express, { Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3000;
const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Create uploads folder if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    cb(null, `${uuidv4()}-${file.originalname}`);
  },
});

// Optional: File filter (example: only allow text files)
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  // Example: accept all files
  cb(null, true);
};

const upload = multer({ storage, fileFilter });

// Routes
app.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ message: 'File uploaded successfully', filename: req.file.filename });
});

app.get('/download/:filename', (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

