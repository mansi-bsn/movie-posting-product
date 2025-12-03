const jwt = require('jsonwebtoken');
const User = require('../models/users');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication Middleware
const authenticate = async (req, res, next) => {
    try {
        // Get token from cookie
        const token = req.cookies.token;

        if (!token) {
            return res.redirect('/login');
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            res.clearCookie('token');
            return res.redirect('/login');
        }

        // Attach user to request object
        req.user = user;
        req.userId = decoded.userId;

        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.clearCookie('token');
        res.redirect('/login');
    }
};

// Optional: Middleware to check if user is already logged in (redirect to home if logged in)
const redirectIfAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (user) {
            return res.redirect('/');
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = {
    authenticate,
    redirectIfAuthenticated
};

