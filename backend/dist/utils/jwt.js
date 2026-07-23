"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function signToken(user) {
    const secret = process.env.JWT_SECRET;
    const options = {
        expiresIn: (process.env.JWT_EXPIRES_IN || "7d"),
    };
    return jsonwebtoken_1.default.sign({ sub: user._id.toString() }, secret, options);
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET); // throws if invalid/expired
}
//# sourceMappingURL=jwt.js.map