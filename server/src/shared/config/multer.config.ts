import multer from "multer";
import path, { join } from "path";
import fs from "fs";
import { BadRequestError, UnauthorizedError } from "../errors";
import type { AuthenticatedRequest } from "../middleware/auth";
import { MedicalService } from "server/src/modules/medical/service/medical.service";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/gif",
	"image/webp",
];

interface MulterConfigOptions {
	destination: string;
	fieldName?: string;
	maxFileSize?: number;
	allowedMimeTypes?: string[];
}

export const MULTER_CONSTANTS = {
	MAX_FILE_SIZE,
	ALLOWED_IMAGE_TYPES,
};

export function createMulterConfig(
	options: MulterConfigOptions & {
		validateUser?: boolean;
		appendUserId?: boolean;
	},
) {
	const {
		destination,
		fieldName = "image",
		maxFileSize = MAX_FILE_SIZE,
		allowedMimeTypes = ALLOWED_IMAGE_TYPES,
		appendUserId = false,
	} = options;

	// Storage configuration
	const storage = multer.diskStorage({
		destination: (req: AuthenticatedRequest, _file, cb) => {
			let uploadPath = path.join(process.cwd(), destination);

			if (appendUserId && !req.user) {
				return cb(
					new UnauthorizedError("User must be logged in to upload a file"),
					uploadPath,
				);
			}

			if (appendUserId && req.user) {
				uploadPath = path.join(uploadPath, req.user.userId);
			}

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
			const baseName = path
				.basename(file.originalname, ext)
				.replace(/[^a-zA-Z0-9]/g, "_");
			const filename = `${baseName}_${timestamp}_${randomStr}${ext}`;
			cb(null, filename);
		},
	});

	const fileFilter = (
		req: Express.Request,
		file: Express.Multer.File,
		cb: multer.FileFilterCallback,
	) => {
		if (allowedMimeTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(
				new BadRequestError(
					`Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`,
				),
			);
		}
	};

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

function createMulterConfigMultiple(
	options: MulterConfigOptions,
	maxCount: number = 5,
) {
	const {
		destination,
		fieldName = "images",
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
			const baseName = path
				.basename(file.originalname, ext)
				.replace(/[^a-zA-Z0-9]/g, "_");
			const filename = `${baseName}_${timestamp}_${randomStr}${ext}`;
			cb(null, filename);
		},
	});

	const fileFilter = (
		req: Express.Request,
		file: Express.Multer.File,
		cb: multer.FileFilterCallback,
	) => {
		if (allowedMimeTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(
				new BadRequestError(
					`Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`,
				),
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

const MAX_AUDIO_SIZE = 3 * 1024 * 1024;
const ALLOWED_AUDIO_WAV_TYPES = ["audio/wav", "audio/wave", "audio/x-wav"];

export const memoryUpload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: MAX_FILE_SIZE,
	},
	fileFilter: (
		req: Express.Request,
		file: Express.Multer.File,
		cb: multer.FileFilterCallback,
	) => {
		if (file.mimetype.startsWith("image/")) {
			cb(null, true);
		} else {
			cb(new BadRequestError("Only image files are allowed"));
		}
	},
});

export const audioWavMemoryUpload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: MAX_AUDIO_SIZE,
		files: 1,
	},
	fileFilter: (
		req: Express.Request,
		file: Express.Multer.File,
		cb: multer.FileFilterCallback,
	) => {
		const ok = ALLOWED_AUDIO_WAV_TYPES.includes(file.mimetype);
		if (ok) {
			cb(null, true);
		} else {
			cb(
				new BadRequestError(
					"Only .wav audio is allowed. Allowed types: audio/wav, audio/wave, audio/x-wav",
				),
			);
		}
	},
});

export const uploadPhysicianImage = createMulterConfig({
	destination: join("public", "uploads", "physicians"),
	fieldName: "image",
});
export const medicalRecordUpload = createMulterConfig({
	destination: MedicalService.LAB_REPORT_PATH,
	fieldName: "file",
	allowedMimeTypes: ["application/pdf", ...ALLOWED_IMAGE_TYPES],
	appendUserId: true,
});
