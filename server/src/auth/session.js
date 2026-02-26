import jwt from "jsonwebtoken";
const SESSION_COOKIE = "hf_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is required.");
    }
    return secret;
}
export function signSession(payload) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: SESSION_TTL_SECONDS });
}
export function verifySession(token) {
    try {
        return jwt.verify(token, getJwtSecret());
    }
    catch {
        return null;
    }
}
export function setSessionCookie(res, token) {
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: SESSION_TTL_SECONDS * 1000,
        path: "/",
    });
}
export function clearSessionCookie(res) {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
    });
}
export function getSessionCookieName() {
    return SESSION_COOKIE;
}
