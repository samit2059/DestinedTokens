const rateLimit = require('express-rate-limit');

const signupRateLimit = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 5, // Limit each IP to 5 signups per windowMs
    message: {
        error: "Too many accounts created. Please try again later."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // Custom key generator to include fingerprint
    keyGenerator: (req) => {
        const ip = req.ip || req.headers['x-forwarded-for'];
        const fingerprint = req.headers['x-device-fingerprint'] || "unknown";
        return `${ip}:${fingerprint}`;
    },
    validate: {
        keyGeneratorIpFallback: false,
    }
});

module.exports = signupRateLimit;