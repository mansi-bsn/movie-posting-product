const User = require('../models/users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// JWT Secret - should be in environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Signup Controller
const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).render('signUp', { 
                error: 'All fields are required',
                username: username || '',
                email: email || ''
            });
        }

        if (password.length < 6) {
            return res.status(400).render('signUp', { 
                error: 'Password must be at least 6 characters long',
                username: username || '',
                email: email || ''
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).render('signUp', { 
                error: 'User with this email or username already exists',
                username: username || '',
                email: email || ''
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: 'user'
        });

        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser._id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.redirect('/');
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).render('signUp', { 
            error: 'An error occurred during signup. Please try again.',
            username: req.body.username || '',
            email: req.body.email || ''
        });
    }
};

// Login Controller
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).render('login', { 
                error: 'Email and password are required',
                email: email || ''
            });
        }

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).render('login', { 
                error: 'Invalid email or password',
                email: email || ''
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).render('login', { 
                error: 'Invalid email or password',
                email: email || ''
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('login', { 
            error: 'An error occurred during login. Please try again.',
            email: req.body.email || ''
        });
    }
};

// Logout Controller
const logout = (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
};

module.exports = {
    signup,
    login,
    logout
};

