import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Session from "../models/session.model.js";
import User from "../models/user.model.js";

export async function verifySession(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (!mongoose.isObjectIdOrHexString(decoded.id) || typeof decoded.jti !== "string") throw new Error("Invalid session");
    let exists;
    try {
        exists = await Session.exists({ _id: decoded.jti, userId: decoded.id, expiresAt: { $gt: new Date() } }) &&
            await User.exists({ _id: decoded.id });
    } catch (cause) {
        throw Object.assign(new Error("Session service unavailable", { cause }), { code: "SESSION_UNAVAILABLE" });
    }
    if (!exists) throw new Error("Invalid session");
    return decoded;
}
