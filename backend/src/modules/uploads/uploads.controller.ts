import fs from "node:fs/promises";
import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ok } from "../../utils/response.js";
import { imageUrlForFilename, verifyImageSignature } from "../../lib/upload.js";

export const uploadImageHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError("VALIDATION_ERROR", "No image file provided");
  }

  if (!(await verifyImageSignature(req.file.path))) {
    await fs.unlink(req.file.path).catch(() => {});
    throw new ApiError("VALIDATION_ERROR", "File content doesn't match a JPEG, PNG, or WEBP image");
  }

  ok(res, { url: imageUrlForFilename(req.file.filename) }, undefined, 201);
});
