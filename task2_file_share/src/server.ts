import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
fs.ensureDirSync(uploadsDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// In-memory storage for file metadata
interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  uploadDate: Date;
  lastDownload: Date | null;
  downloadCount: number;
  size: number;
}

const fileMetadata = new Map<string, FileMetadata>();

// Routes
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = uuidv4();
    const metadata: FileMetadata = {
      id: fileId,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      uploadDate: new Date(),
      lastDownload: null,
      downloadCount: 0,
      size: req.file.size
    };

    fileMetadata.set(fileId, metadata);

    const downloadUrl = `${req.protocol}://${req.get('host')}/api/files/${fileId}/download`;

    res.json({
      success: true,
      downloadUrl,
      fileId,
      metadata: {
        originalName: metadata.originalName,
        size: metadata.size,
        uploadDate: metadata.uploadDate
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/api/files/:id/download', (req, res) => {
  try {
    const fileId = req.params.id;
    const metadata = fileMetadata.get(fileId);

    if (!metadata) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadsDir, metadata.fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    // Update metadata
    metadata.lastDownload = new Date();
    metadata.downloadCount += 1;

    res.download(filePath, metadata.originalName);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

app.get('/api/files/stats', (req, res) => {
  try {
    const stats = Array.from(fileMetadata.values()).map(meta => ({
      id: meta.id,
      originalName: meta.originalName,
      uploadDate: meta.uploadDate,
      lastDownload: meta.lastDownload,
      downloadCount: meta.downloadCount,
      size: meta.size
    }));

    const totalFiles = fileMetadata.size;
    const totalDownloads = stats.reduce((sum, file) => sum + file.downloadCount, 0);
    const totalSize = stats.reduce((sum, file) => sum + file.size, 0);

    res.json({
      totalFiles,
      totalDownloads,
      totalSize,
      files: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

app.delete('/api/files/:id', (req, res) => {
  try {
    const fileId = req.params.id;
    const metadata = fileMetadata.get(fileId);

    if (!metadata) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadsDir, metadata.fileName);
    
    // Delete file from disk
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete metadata
    fileMetadata.delete(fileId);

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// File cleanup service
function cleanupOldFiles(maxAgeDays: number = 30) {
  const now = new Date();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  for (const [fileId, metadata] of fileMetadata.entries()) {
    const lastActivity = metadata.lastDownload || metadata.uploadDate;
    const age = now.getTime() - lastActivity.getTime();

    if (age > maxAgeMs) {
      const filePath = path.join(uploadsDir, metadata.fileName);
      
      // Delete file from disk
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted old file: ${metadata.originalName}`);
        } catch (error) {
          console.error(`Error deleting file ${metadata.originalName}:`, error);
        }
      }

      // Delete metadata
      fileMetadata.delete(fileId);
    }
  }
}

// Run cleanup every hour
setInterval(() => cleanupOldFiles(30), 60 * 60 * 1000);

// Frontend serving
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`File service running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${uploadsDir}`);
});
