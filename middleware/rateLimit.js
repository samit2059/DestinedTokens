const rateLimit = require('express-rate-limit');
// define the limit for products creation 
const addRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,//15 minutes
    max: 5,//max 5 requests per 15 minutes
    message: {
        error: "Too many products created. Please try again after 15 minutes."
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = addRateLimit;