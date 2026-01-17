// Middleware: checkAdmin.js
const jwt = require('jsonwebtoken');
const User = require('../models/Users'); // Assuming your User model path
const { JWT_SECRET } = require('../config');

const checkAdmin = async (req, res, next) => {
    // 1. Authenticate (same as fetchUser)
    const token = req.header('auth-token');
    if (!token) {
        return res.status(401).send({ error: "Please authenticate using a valid token" });
    }

    try {
        const data = jwt.verify(token, JWT_SECRET);
        req.user = data.user; // Attach user payload to the request

        // 2. Authorize (Admin Check)
        // Fetch user from DB and check their role field
        const user = await User.findById(req.user.id).select('userType');
        if (!user || user.userType !== 'admin') {
            return res.status(403).send({ error: "Access Forbidden: Not an Admin" });
        }
        next(); // Only proceed if role is 'admin'
    } catch (err) {
        res.status(401).send({ error: "Please authenticate using a valid token" });
        console.error('checkAdmin middleware error:', err);
        // res.status(500).send("Internal Server Error during role check");
    }
};

module.exports = checkAdmin;