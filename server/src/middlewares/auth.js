function getApiKey(req) {
    const auth = req.headers.authorization;
    if (auth && typeof auth === "string") {
        const parts = auth.split(" ");
        if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
            return parts[1];
        }
    }

    const headerKey = req.headers["x-api-key"];
    if (typeof headerKey === "string") return headerKey;

    return null;
}

function requireAdmin(req, res, next) {
    const expected = process.env.ADMIN_API_KEY;
    if (!expected) {
        return res
            .status(500)
            .json({ error: "Server misconfigured: ADMIN_API_KEY missing" });
    }

    const apiKey = getApiKey(req);
    if (!apiKey || apiKey !== expected) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    return next();
}

function requireSuperAdmin(req, res, next) {
    const expected = process.env.SUPERADMIN_API_KEY;
    if (!expected) {
        return res.status(500).json({
            error: "Server misconfigured: SUPERADMIN_API_KEY missing",
        });
    }

    const apiKey = getApiKey(req);
    if (!apiKey || apiKey !== expected) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    return next();
}

module.exports = {
    requireAdmin,
    requireSuperAdmin,
};
