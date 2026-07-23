"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const jwt_1 = require("../utils/jwt");
const User_1 = require("../models/User");
async function authenticate(req, res, next) {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
        res.status(401).json({ error: "Missing or malformed Authorization header." });
        return;
    }
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        const user = await User_1.User.findById(payload.sub);
        if (!user) {
            res.status(401).json({ error: "User no longer exists." });
            return;
        }
        req.user = user;
        next();
    }
    catch {
        res.status(401).json({ error: "Invalid or expired token." });
    }
}
//# sourceMappingURL=auth.js.map