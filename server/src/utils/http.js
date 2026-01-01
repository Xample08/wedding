function asyncHandler(fn) {
    return function wrapped(req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
}

function asTrimmedString(value) {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
}

function asOptionalInt(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && Number.isInteger(value)) return value;
    if (typeof value === "string" && value.trim().length) {
        const n = Number(value);
        if (Number.isInteger(n)) return n;
    }
    return null;
}

function asOptionalBoolean(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === "boolean") return value;
    if (typeof value === "number")
        return value === 1 ? true : value === 0 ? false : null;
    if (typeof value === "string") {
        const v = value.trim().toLowerCase();
        if (["true", "1", "yes", "y"].includes(v)) return true;
        if (["false", "0", "no", "n"].includes(v)) return false;
    }
    return null;
}

function pickIp(req) {
    // If behind a proxy, set app.set('trust proxy', true)
    return req.ip;
}

module.exports = {
    asyncHandler,
    isNonEmptyString,
    asTrimmedString,
    asOptionalInt,
    asOptionalBoolean,
    pickIp,
};
