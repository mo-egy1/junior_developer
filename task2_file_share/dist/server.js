"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const uuid_1 = require("uuid");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '../uploads');
fs_extra_1.default.ensureDirSync(uploadsDir);
// Configure multer for file uploads
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${(0, uuid_1.v4)()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});
const fileMetadata = new Map();
// Routes
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const fileId = (0, uuid_1.v4)();
        const metadata = {
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
    }
    catch (error) {
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
        const filePath = path_1.default.join(uploadsDir, metadata.fileName);
        if (!fs_extra_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on disk' });
        }
        // Update metadata
        metadata.lastDownload = new Date();
        metadata.downloadCount += 1;
        res.download(filePath, metadata.originalName);
    }
    catch (error) {
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
    }
    catch (error) {
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
        const filePath = path_1.default.join(uploadsDir, metadata.fileName);
        // Delete file from disk
        if (fs_extra_1.default.existsSync(filePath)) {
            fs_extra_1.default.unlinkSync(filePath);
        }
        // Delete metadata
        fileMetadata.delete(fileId);
        res.json({ success: true, message: 'File deleted successfully' });
    }
    catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Delete failed' });
    }
});
// File cleanup service
function cleanupOldFiles(maxAgeDays = 30) {
    const now = new Date();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    for (const [fileId, metadata] of fileMetadata.entries()) {
        const lastActivity = metadata.lastDownload || metadata.uploadDate;
        const age = now.getTime() - lastActivity.getTime();
        if (age > maxAgeMs) {
            const filePath = path_1.default.join(uploadsDir, metadata.fileName);
            // Delete file from disk
            if (fs_extra_1.default.existsSync(filePath)) {
                try {
                    fs_extra_1.default.unlinkSync(filePath);
                    console.log(`Deleted old file: ${metadata.originalName}`);
                }
                catch (error) {
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
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
app.listen(PORT, () => {
    console.log(`File service running on http://localhost:${PORT}`);
    console.log(`Uploads directory: ${uploadsDir}`);
});
