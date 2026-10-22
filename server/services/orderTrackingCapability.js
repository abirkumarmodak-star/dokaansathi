"use strict";

const crypto = require("crypto");

function generateTrackingCapability() {
    return crypto.randomBytes(32).toString("base64url");
}

function hashTrackingCapability(capability) {
    if (typeof capability !== "string" || capability.length === 0) {
        throw new TypeError("A tracking capability is required.");
    }

    return crypto.createHash("sha256").update(capability, "utf8").digest("hex");
}

function verifyTrackingCapability(storedHash, capability) {
    if (
        typeof storedHash !== "string" ||
        !/^[a-f0-9]{64}$/i.test(storedHash) ||
        typeof capability !== "string" ||
        capability.length === 0
    ) {
        return false;
    }

    const expected = Buffer.from(storedHash, "hex");
    const actual = Buffer.from(hashTrackingCapability(capability), "hex");
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = {
    generateTrackingCapability,
    hashTrackingCapability,
    verifyTrackingCapability
};
