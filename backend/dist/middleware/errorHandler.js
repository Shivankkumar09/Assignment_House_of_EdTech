"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
exports.errorHandler = errorHandler;
const HttpError_1 = require("../utils/HttpError");
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
function isValidationError(err) {
    return err instanceof Error && err.name === "ValidationError";
}
function isDuplicateKeyError(err) {
    return err instanceof Error && err.code === 11000;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function errorHandler(err, req, res, next) {
    console.error("[error]", err);
    if (isValidationError(err)) {
        res.status(400).json({
            error: Object.values(err.errors)
                .map((e) => e.message)
                .join(", "),
        });
        return;
    }
    if (isDuplicateKeyError(err)) {
        res.status(409).json({ error: "That value is already in use." });
        return;
    }
    const status = err instanceof HttpError_1.HttpError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Internal server error.";
    res.status(status).json({ error: message || "Internal server error." });
}
//# sourceMappingURL=errorHandler.js.map