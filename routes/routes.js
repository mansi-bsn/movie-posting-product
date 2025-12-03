const express = require('express');
const router = express.Router();
const multer = require('multer');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const authController = require('../controllers/authController');
const movieController = require('../controllers/movieController');
const reviewController = require('../controllers/reviewController');
const watchlistController = require('../controllers/watchlistController');
const adminController = require('../controllers/adminController');
const actorController = require('../controllers/actorController');
const directorController = require('../controllers/directorController');
const { authenticate, redirectIfAuthenticated } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/adminMiddleware');
const { upload, uploadMultiple, uploadActor, uploadDirector } = require('../middlewares/upload');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// ==================== PUBLIC ROUTES ====================

// Home page
router.get('/', async (req, res) => {
  let user = null;
  if (req.cookies.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, JWT_SECRET);
      user = await User.findById(decoded.userId).select('-password');
      if (user) {
        return res.redirect('/movies');
      }
    } catch (error) {
      // Token invalid
    }
  }
  res.render('index', { user });
});

// Authentication routes
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login', { error: null, email: '' });
});

router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('signUp', { error: null, username: '', email: '' });
});

router.get('/signup', redirectIfAuthenticated, (req, res) => {
  res.render('signUp', { error: null, username: '', email: '' });
});

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// ==================== PROTECTED ROUTES ====================

// Profile
router.get('/profile', authenticate, (req, res) => {
  res.render('profile', { user: req.user });
});

// ==================== MOVIE ROUTES ====================

// Multer error handler
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            const isEdit = req.path.includes('/edit/');
            const view = isEdit ? 'movies/edit' : 'movies/add';
            const movie = isEdit ? { ...req.body, _id: req.params.id } : req.body;
            return res.status(400).render(view, {
                user: req.user,
                error: 'File size too large. Maximum size is 5MB.',
                movie: movie
            });
        }
    } else if (err) {
        const isEdit = req.path.includes('/edit/');
        const view = isEdit ? 'movies/edit' : 'movies/add';
        const movie = isEdit ? { ...req.body, _id: req.params.id } : req.body;
        return res.status(400).render(view, {
            user: req.user,
            error: err.message || 'Error uploading file. Please try again.',
            movie: movie
        });
    }
    next();
};

// Movie list with search and filters
router.get('/movies', authenticate, movieController.getAllMovies);

// Add movie (must come before /movies/:id)
router.get('/movies/add', authenticate, movieController.showAddForm);
router.post('/movies/add', authenticate, uploadMultiple, handleMulterError, movieController.createMovie);

// Edit movie (must come before /movies/:id)
router.get('/movies/edit/:id', authenticate, movieController.showEditForm);
router.post('/movies/edit/:id', authenticate, uploadMultiple, handleMulterError, movieController.updateMovie);

// Delete movie (must come before /movies/:id)
router.get('/movies/delete/:id', authenticate, movieController.deleteMovie);

// Movie detail page (must be last to avoid conflicts)
router.get('/movies/:id', authenticate, movieController.getMovieDetail);

// Trending movies API
router.get('/api/movies/trending', authenticate, movieController.getTrendingMovies);

// ==================== REVIEW ROUTES ====================

// Create/Update review
router.post('/api/reviews', authenticate, reviewController.createReview);

// Get reviews for a movie
router.get('/api/reviews/:movieId', authenticate, reviewController.getMovieReviews);

// Delete review (admin only)
router.delete('/api/reviews/:reviewId', authenticate, isAdmin, reviewController.deleteReview);

// ==================== WATCHLIST ROUTES ====================

// Toggle watchlist
router.post('/api/watchlist/toggle', authenticate, watchlistController.toggleWatchlist);

// Get user watchlist
router.get('/my-watchlist', authenticate, watchlistController.getWatchlist);

// ==================== ACTOR ROUTES ====================

// Actor list
router.get('/actors', authenticate, actorController.getAllActors);

// Actor detail
router.get('/actors/:id', authenticate, actorController.getActorDetail);

// Add actor (admin only)
router.get('/actors/add', authenticate, isAdmin, actorController.showAddForm);
router.post('/actors/add', authenticate, isAdmin, uploadActor.single('photo'), actorController.createActor);

// ==================== DIRECTOR ROUTES ====================

// Director list
router.get('/directors', authenticate, directorController.getAllDirectors);

// Director detail
router.get('/directors/:id', authenticate, directorController.getDirectorDetail);

// Add director (admin only)
router.get('/directors/add', authenticate, isAdmin, directorController.showAddForm);
router.post('/directors/add', authenticate, isAdmin, uploadDirector.single('photo'), directorController.createDirector);

// ==================== ADMIN ROUTES ====================

// Admin dashboard
router.get('/admin/dashboard', authenticate, isAdmin, adminController.getDashboard);

module.exports = router;
