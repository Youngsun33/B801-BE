"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteImage = exports.uploadImage = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('이미지 파일만 업로드할 수 있습니다.'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});
exports.uploadSingle = upload.single('image');
const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: '이미지 파일이 필요합니다.' });
            return;
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({
            success: true,
            message: '이미지가 성공적으로 업로드되었습니다.',
            fileUrl: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size
        });
    }
    catch (error) {
        console.error('이미지 업로드 오류:', error);
        res.status(500).json({ error: '이미지 업로드 중 오류가 발생했습니다.' });
    }
};
exports.uploadImage = uploadImage;
const deleteImage = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path_1.default.join(uploadDir, filename);
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            res.status(200).json({ success: true, message: '이미지가 삭제되었습니다.' });
        }
        else {
            res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
        }
    }
    catch (error) {
        console.error('이미지 삭제 오류:', error);
        res.status(500).json({ error: '이미지 삭제 중 오류가 발생했습니다.' });
    }
};
exports.deleteImage = deleteImage;
//# sourceMappingURL=uploadController.js.map