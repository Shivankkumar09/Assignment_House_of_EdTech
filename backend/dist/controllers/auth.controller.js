"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.me = me;
const User_1 = require("../models/User");
const jwt_1 = require("../utils/jwt");
const HttpError_1 = require("../utils/HttpError");
async function signup(req, res) {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) {
        throw new HttpError_1.HttpError(400, "Name, email, and password are required.");
    }
    if (password.length < 8) {
        throw new HttpError_1.HttpError(400, "Password must be at least 8 characters.");
    }
    const existing = await User_1.User.findOne({ email: email.toLowerCase().trim() });
    if (existing)
        throw new HttpError_1.HttpError(409, "An account with this email already exists.");
    const passwordHash = await User_1.User.hashPassword(password);
    const user = await User_1.User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash });
    const token = (0, jwt_1.signToken)(user);
    res.status(201).json({ token, user: user.toPublicJSON() });
}
async function login(req, res) {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
        throw new HttpError_1.HttpError(400, "Email and password are required.");
    }
    const user = await User_1.User.findOne({ email: email.toLowerCase().trim() });
    if (!user)
        throw new HttpError_1.HttpError(401, "Incorrect email or password.");
    const valid = await user.comparePassword(password);
    if (!valid)
        throw new HttpError_1.HttpError(401, "Incorrect email or password.");
    const token = (0, jwt_1.signToken)(user);
    res.json({ token, user: user.toPublicJSON() });
}
async function me(req, res) {
    res.json({ user: req.user.toPublicJSON() });
}
//# sourceMappingURL=auth.controller.js.map