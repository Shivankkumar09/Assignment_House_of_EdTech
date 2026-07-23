"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = "HttpError";
    }
}
exports.HttpError = HttpError;
//# sourceMappingURL=HttpError.js.map