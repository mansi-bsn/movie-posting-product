const Movie = require('../models/movies');
const Review = require('../models/reviews');
const Actor = require('../models/actors');
const Director = require('../models/directors');
const User = require('../models/users');
const fs = require('fs');
const path = require('path');

/**
 * Convert a YouTube URL to an embeddable format.
 * Supports youtube.com, youtu.be, shorts, and embed links.
 */
const getYouTubeEmbedUrl = (url) => {
    try {
        const parsedUrl = new URL(url.trim());
        const hostname = parsedUrl.hostname.replace('www.', '');
        let videoId = '';

        if (hostname === 'youtu.be') {
            videoId = parsedUrl.pathname.slice(1);
        } else if (hostname.includes('youtube.com')) {
            if (parsedUrl.pathname === '/watch') {
                videoId = parsedUrl.searchParams.get('v');
            } else if (parsedUrl.pathname.startsWith('/embed/')) {
                videoId = parsedUrl.pathname.split('/embed/')[1];
            } else if (parsedUrl.pathname.startsWith('/shorts/')) {
                videoId = parsedUrl.pathname.split('/shorts/')[1];
            } else if (parsedUrl.pathname.startsWith('/live/')) {
                videoId = parsedUrl.pathname.split('/live/')[1];
            }
        }

        if (!videoId) {
            return null;
        }

        return `https://www.youtube.com/embed/${videoId}`;
    } catch (error) {
        return null;
    }
};

// Helper function to calculate trending score
const calculateTrendingScore = (movie) => {
    const viewsWeight = 0.3;
    const reviewsWeight = 0.4;
    const ratingWeight = 0.3;
    
    const reviewsCount = movie.reviewsCount || 0;
    const avgRating = movie.averageRating || 0;
    const views = movie.views || 0;
    
    // Normalize scores (assuming max views ~10000, max reviews ~100)
    const normalizedViews = Math.min(views / 10000, 1);
    const normalizedReviews = Math.min(reviewsCount / 100, 1);
    const normalizedRating = avgRating / 5; // 5 star rating
    
    return (normalizedViews * viewsWeight) + 
           (normalizedReviews * reviewsWeight) + 
           (normalizedRating * ratingWeight);
};

// Get all movies with search and filters
const getAllMovies = async (req, res) => {
    try {
        const { search, genre, year, minRating, trending } = req.query;
        let query = {};
        
        // Search functionality
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { searchKeywords: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Genre filter
        if (genre && genre !== 'all') {
            query.genre = { $in: [genre] };
        }
        
        // Year filter
        if (year && year !== 'all') {
            const startDate = new Date(`${year}-01-01`);
            const endDate = new Date(`${year}-12-31`);
            query.releaseDate = { $gte: startDate, $lte: endDate };
        }
        
        // Rating filter
        if (minRating) {
            query.rating = { $gte: parseFloat(minRating) };
        }
        
        let movies = await Movie.find(query)
            .populate('director', 'name')
            .populate('actors', 'name')
            .sort({ createdAt: -1 });
        
        // Calculate average ratings and reviews count
        for (let movie of movies) {
            const reviews = await Review.find({ movie: movie._id, isDeleted: false });
            const reviewsCount = reviews.length;
            const avgRating = reviewsCount > 0 
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount 
                : 0;
            
            movie.reviewsCount = reviewsCount;
            movie.averageRating = avgRating;
            movie.trendingScore = calculateTrendingScore(movie);
        }
        
        // Trending filter
        if (trending === 'true') {
            movies = movies.sort((a, b) => b.trendingScore - a.trendingScore);
        }
        
        // Get unique genres for filter dropdown
        const allMovies = await Movie.find();
        const genres = [...new Set(allMovies.flatMap(m => m.genre))];
        const years = [...new Set(allMovies.map(m => new Date(m.releaseDate).getFullYear()))].sort((a, b) => b - a);
        
        res.render('movies/list', { 
            movies, 
            user: req.user,
            filters: { search, genre, year, minRating, trending },
            genres,
            years
        });
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).render('movies/list', { 
            movies: [], 
            error: 'Error fetching movies',
            user: req.user,
            filters: {},
            genres: [],
            years: []
        });
    }
};

// Get movie detail page
const getMovieDetail = async (req, res) => {
    try {
        const movieId = req.params.id;
        
        // Increment views
        await Movie.findByIdAndUpdate(movieId, { $inc: { views: 1 } });
        
        const movie = await Movie.findById(movieId)
            .populate('director', 'name photo bio')
            .populate('actors', 'name photo');
        
        if (!movie) {
            return res.status(404).redirect('/movies');
        }
        
        // Get reviews with user info
        const reviews = await Review.find({ movie: movieId, isDeleted: false })
            .populate('user', 'username')
            .sort({ createdAt: -1 });
        
        // Calculate average rating
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        
        // Check if user has reviewed
        let userReview = null;
        if (req.user) {
            userReview = await Review.findOne({ movie: movieId, user: req.user._id });
        }
        
        // Check if in watchlist
        let inWatchlist = false;
        if (req.user) {
            const user = await User.findById(req.user._id);
            inWatchlist = user.watchlist.includes(movieId);
        }
        
        // Get related movies (same genre)
        const relatedMovies = await Movie.find({
            _id: { $ne: movieId },
            genre: { $in: movie.genre }
        })
        .limit(6)
        .populate('director', 'name')
        .populate('actors', 'name');
        
        // Calculate ratings for related movies
        for (let relatedMovie of relatedMovies) {
            const relatedReviews = await Review.find({ movie: relatedMovie._id, isDeleted: false });
            relatedMovie.averageRating = relatedReviews.length > 0
                ? relatedReviews.reduce((sum, r) => sum + r.rating, 0) / relatedReviews.length
                : 0;
        }
        
        res.render('movies/detail', {
            movie,
            reviews,
            avgRating,
            userReview,
            inWatchlist,
            relatedMovies,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching movie detail:', error);
        res.status(500).redirect('/movies');
    }
};

// Show add movie form
const showAddForm = async (req, res) => {
    try {
        const actors = await Actor.find().sort({ name: 1 });
        const directors = await Director.find().sort({ name: 1 });
        res.render('movies/add', { 
            user: req.user, 
            error: null, 
            movie: null,
            actors,
            directors
        });
    } catch (error) {
        console.error('Error loading add form:', error);
        res.status(500).redirect('/movies');
    }
};

// Create new movie
const createMovie = async (req, res) => {
    try {
        const { title, description, genre, releaseDate, trailerUrl, director, actors } = req.body;
        
        // Validation
        if (!title || !description || !releaseDate) {
            const actors = await Actor.find().sort({ name: 1 });
            const directors = await Director.find().sort({ name: 1 });
            return res.status(400).render('movies/add', {
                user: req.user,
                error: 'Title, description, and release date are required',
                movie: req.body,
                actors,
                directors
            });
        }
        
        // Handle genre (can be string or array)
        let genresArray = [];
        if (Array.isArray(genre)) {
            genresArray = genre;
        } else if (typeof genre === 'string') {
            genresArray = genre.split(',').map(g => g.trim());
        }
        
        // Handle poster upload
        let posterPath = null;
        if (req.files && req.files.poster && req.files.poster[0]) {
            posterPath = '/uploads/movies/' + req.files.poster[0].filename;
        }

        // Handle gallery uploads
        let galleryPaths = [];
        if (req.files && req.files.gallery) {
            galleryPaths = req.files.gallery.map(file => '/uploads/movies/' + file.filename);
        }

        // Validate YouTube URL if provided
        let validTrailerUrl = null;
        if (trailerUrl) {
            const embedUrl = getYouTubeEmbedUrl(trailerUrl);
            if (!embedUrl) {
                const actors = await Actor.find().sort({ name: 1 });
                const directors = await Director.find().sort({ name: 1 });
                return res.status(400).render('movies/add', {
                    user: req.user,
                    error: 'Invalid YouTube URL',
                    movie: req.body,
                    actors,
                    directors
                });
            }
            validTrailerUrl = embedUrl;
        }
        
        // Create search keywords
        const searchKeywords = [
            title.toLowerCase(),
            ...genresArray.map(g => g.toLowerCase())
        ];
        
        const newMovie = new Movie({
            title,
            description,
            genre: genresArray,
            releaseDate: new Date(releaseDate),
            poster: posterPath,
            gallery: galleryPaths,
            trailerUrl: validTrailerUrl,
            director: director || null,
            actors: actors ? (Array.isArray(actors) ? actors : [actors]) : [],
            searchKeywords
        });
        
        await newMovie.save();
        
        // Update director and actors
        if (director) {
            await Director.findByIdAndUpdate(director, {
                $addToSet: { moviesWorkedIn: newMovie._id }
            });
        }
        
        if (actors && actors.length > 0) {
            const actorIds = Array.isArray(actors) ? actors : [actors];
            await Actor.updateMany(
                { _id: { $in: actorIds } },
                { $addToSet: { moviesWorkedIn: newMovie._id } }
            );
        }
        
        res.redirect('/movies');
    } catch (error) {
        console.error('Error creating movie:', error);
        // Delete uploaded files if movie creation fails
        if (req.files) {
            if (req.files.poster) {
                req.files.poster.forEach(file => {
                    const filePath = path.join(__dirname, '../public/uploads/movies', file.filename);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                });
            }
            if (req.files.gallery) {
                req.files.gallery.forEach(file => {
                    const filePath = path.join(__dirname, '../public/uploads/movies', file.filename);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                });
            }
        }
        const actors = await Actor.find().sort({ name: 1 });
        const directors = await Director.find().sort({ name: 1 });
        res.status(500).render('movies/add', {
            user: req.user,
            error: 'Error creating movie. Please try again.',
            movie: req.body,
            actors,
            directors
        });
    }
};

// Show edit movie form
const showEditForm = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id)
            .populate('director')
            .populate('actors');
        
        if (!movie) {
            return res.status(404).redirect('/movies');
        }
        
        const actors = await Actor.find().sort({ name: 1 });
        const directors = await Director.find().sort({ name: 1 });
        
        res.render('movies/edit', { 
            movie, 
            user: req.user, 
            error: null,
            actors,
            directors
        });
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.redirect('/movies');
    }
};

// Update movie
const updateMovie = async (req, res) => {
    try {
        const { title, description, genre, releaseDate, trailerUrl, director, actors, removeGallery } = req.body;
        
        // Validation
        if (!title || !description || !releaseDate) {
            const movie = await Movie.findById(req.params.id)
                .populate('director')
                .populate('actors');
            const actorsList = await Actor.find().sort({ name: 1 });
            const directors = await Director.find().sort({ name: 1 });
            return res.status(400).render('movies/edit', {
                user: req.user,
                error: 'Title, description, and release date are required',
                movie: { ...movie.toObject(), ...req.body },
                actors: actorsList,
                directors
            });
        }
        
        const existingMovie = await Movie.findById(req.params.id);
        if (!existingMovie) {
            return res.status(404).redirect('/movies');
        }
        
        // Handle genre
        let genresArray = [];
        if (Array.isArray(genre)) {
            genresArray = genre;
        } else if (typeof genre === 'string') {
            genresArray = genre.split(',').map(g => g.trim());
        }
        
        // Handle poster
        let posterPath = existingMovie.poster;
        if (req.files && req.files.poster && req.files.poster[0]) {
            // Delete old poster
            if (existingMovie.poster) {
                const oldPosterPath = path.join(__dirname, '../public', existingMovie.poster);
                if (fs.existsSync(oldPosterPath)) fs.unlinkSync(oldPosterPath);
            }
            posterPath = '/uploads/movies/' + req.files.poster[0].filename;
        }
        
        // Handle gallery
        let galleryPaths = existingMovie.gallery || [];
        
        // Remove gallery images if specified
        if (removeGallery && Array.isArray(removeGallery)) {
            removeGallery.forEach(imagePath => {
                const fullPath = path.join(__dirname, '../public', imagePath);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                galleryPaths = galleryPaths.filter(p => p !== imagePath);
            });
        }
        
        // Add new gallery images
        if (req.files && req.files.gallery) {
            const newGalleryPaths = req.files.gallery.map(file => '/uploads/movies/' + file.filename);
            galleryPaths = [...galleryPaths, ...newGalleryPaths];
        }
        
        // Validate trailer URL
        let validTrailerUrl = existingMovie.trailerUrl;
        if (typeof trailerUrl !== 'undefined') {
            if (trailerUrl) {
                const embedUrl = getYouTubeEmbedUrl(trailerUrl);
                if (!embedUrl) {
                    const movie = await Movie.findById(req.params.id)
                        .populate('director')
                        .populate('actors');
                    const actorsList = await Actor.find().sort({ name: 1 });
                    const directors = await Director.find().sort({ name: 1 });
                    return res.status(400).render('movies/edit', {
                        user: req.user,
                        error: 'Invalid YouTube URL',
                        movie: { ...movie.toObject(), ...req.body },
                        actors: actorsList,
                        directors
                    });
                }
                validTrailerUrl = embedUrl;
            } else {
                validTrailerUrl = null;
            }
        }
        
        // Update search keywords
        const searchKeywords = [
            title.toLowerCase(),
            ...genresArray.map(g => g.toLowerCase())
        ];
        
        await Movie.findByIdAndUpdate(req.params.id, {
            title,
            description,
            genre: genresArray,
            releaseDate: new Date(releaseDate),
            poster: posterPath,
            gallery: galleryPaths,
            trailerUrl: validTrailerUrl,
            director: director || null,
            actors: actors ? (Array.isArray(actors) ? actors : [actors]) : [],
            searchKeywords
        });
        
        // Update director and actors relationships
        if (director !== existingMovie.director?.toString()) {
            // Remove from old director
            if (existingMovie.director) {
                await Director.findByIdAndUpdate(existingMovie.director, {
                    $pull: { moviesWorkedIn: req.params.id }
                });
            }
            // Add to new director
            if (director) {
                await Director.findByIdAndUpdate(director, {
                    $addToSet: { moviesWorkedIn: req.params.id }
                });
            }
        }
        
        // Update actors
        const oldActorIds = existingMovie.actors.map(a => a.toString());
        const newActorIds = actors ? (Array.isArray(actors) ? actors : [actors]) : [];
        
        // Remove from old actors
        const removedActors = oldActorIds.filter(id => !newActorIds.includes(id));
        if (removedActors.length > 0) {
            await Actor.updateMany(
                { _id: { $in: removedActors } },
                { $pull: { moviesWorkedIn: req.params.id } }
            );
        }
        
        // Add to new actors
        const addedActors = newActorIds.filter(id => !oldActorIds.includes(id));
        if (addedActors.length > 0) {
            await Actor.updateMany(
                { _id: { $in: addedActors } },
                { $addToSet: { moviesWorkedIn: req.params.id } }
            );
        }
        
        res.redirect('/movies');
    } catch (error) {
        console.error('Error updating movie:', error);
        res.status(500).redirect('/movies');
    }
};

// Delete movie
const deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        
        if (!movie) {
            return res.status(404).redirect('/movies');
        }
        
        // Delete associated files
        if (movie.poster) {
            const posterPath = path.join(__dirname, '../public', movie.poster);
            if (fs.existsSync(posterPath)) fs.unlinkSync(posterPath);
        }
        
        if (movie.gallery && movie.gallery.length > 0) {
            movie.gallery.forEach(imagePath => {
                const fullPath = path.join(__dirname, '../public', imagePath);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            });
        }
        
        // Remove from director and actors
        if (movie.director) {
            await Director.findByIdAndUpdate(movie.director, {
                $pull: { moviesWorkedIn: movie._id }
            });
        }
        
        if (movie.actors && movie.actors.length > 0) {
            await Actor.updateMany(
                { _id: { $in: movie.actors } },
                { $pull: { moviesWorkedIn: movie._id } }
            );
        }
        
        // Delete reviews
        await Review.deleteMany({ movie: movie._id });
        
        // Remove from user watchlists
        await User.updateMany(
            { watchlist: movie._id },
            { $pull: { watchlist: movie._id } }
        );
        
        await Movie.findByIdAndDelete(req.params.id);
        res.redirect('/movies');
    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).redirect('/movies');
    }
};

// Get trending movies
const getTrendingMovies = async (req, res) => {
    try {
        const movies = await Movie.find().limit(10);
        
        // Calculate trending scores
        for (let movie of movies) {
            const reviews = await Review.find({ movie: movie._id, isDeleted: false });
            movie.reviewsCount = reviews.length;
            movie.averageRating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;
            movie.trendingScore = calculateTrendingScore(movie);
        }
        
        const trendingMovies = movies
            .sort((a, b) => b.trendingScore - a.trendingScore)
            .slice(0, 10);
        
        res.json(trendingMovies);
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        res.status(500).json({ error: 'Error fetching trending movies' });
    }
};

module.exports = {
    getAllMovies,
    getMovieDetail,
    showAddForm,
    createMovie,
    showEditForm,
    updateMovie,
    deleteMovie,
    getTrendingMovies
};
