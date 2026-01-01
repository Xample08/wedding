const crypto = require("crypto");

function generateUrlToken() {
    // 16 bytes => 32 hex chars
    return crypto.randomBytes(16).toString("hex");
}

module.exports = {
    generateUrlToken,
};
