const User = require('../models/users');
const Movie = require('../models/movies');
const Review = require('../models/reviews');
const Actor = require('../models/actors');
const Director = require('../models/directors');

// Admin dashboard
const getDashboard = async (req, res) => {
    try {
        // Total counts
        const totalUsers = await User.countDocuments();
        const totalMovies = await Movie.countDocuments();
        const totalReviews = await Review.countDocuments({ isDeleted: false });
        const totalActors = await Actor.countDocuments();
        const totalDirectors = await Director.countDocuments();
        
        // Average rating calculation
        const reviews = await Review.find({ isDeleted: false });
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        
        // Most reviewed movies
        const movieReviewCounts = await Review.aggregate([
            { $match: { isDeleted: false } },
            { $group: { _id: '$movie', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        
        const mostReviewedMovieIds = movieReviewCounts.map(m => m._id);
        const mostReviewedMovies = await Movie.find({ _id: { $in: mostReviewedMovieIds } })
            .populate('director', 'name')
            .populate('actors', 'name');
        
        // Sort by review count
        mostReviewedMovies.sort((a, b) => {
            const countA = movieReviewCounts.find(m => m._id.toString() === a._id.toString())?.count || 0;
            const countB = movieReviewCounts.find(m => m._id.toString() === b._id.toString())?.count || 0;
            return countB - countA;
        });
        
        // Add review counts to movies
        mostReviewedMovies.forEach(movie => {
            const reviewData = movieReviewCounts.find(m => m._id.toString() === movie._id.toString());
            movie.reviewCount = reviewData ? reviewData.count : 0;
        });
        
        // Trending movies (based on views, reviews, rating)
        const allMovies = await Movie.find()
            .populate('director', 'name')
            .populate('actors', 'name');
        
        for (let movie of allMovies) {
            const movieReviews = await Review.find({ movie: movie._id, isDeleted: false });
            movie.reviewsCount = movieReviews.length;
            movie.averageRating = movieReviews.length > 0
                ? movieReviews.reduce((sum, r) => sum + r.rating, 0) / movieReviews.length
                : 0;
            
            // Calculate trending score
            const viewsWeight = 0.3;
            const reviewsWeight = 0.4;
            const ratingWeight = 0.3;
            const normalizedViews = Math.min(movie.views / 10000, 1);
            const normalizedReviews = Math.min(movie.reviewsCount / 100, 1);
            const normalizedRating = movie.averageRating / 5;
            movie.trendingScore = (normalizedViews * viewsWeight) + 
                                 (normalizedReviews * reviewsWeight) + 
                                 (normalizedRating * ratingWeight);
        }
        
        const trendingMovies = allMovies
            .sort((a, b) => b.trendingScore - a.trendingScore)
            .slice(0, 10);
        
        // Recently added movies
        const recentlyAddedMovies = await Movie.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('director', 'name')
            .populate('actors', 'name');
        
        // Calculate ratings for recently added
        for (let movie of recentlyAddedMovies) {
            const movieReviews = await Review.find({ movie: movie._id, isDeleted: false });
            movie.averageRating = movieReviews.length > 0
                ? movieReviews.reduce((sum, r) => sum + r.rating, 0) / movieReviews.length
                : 0;
        }
        
        // Stats for charts
        const moviesByMonth = await Movie.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        const reviewsByMonth = await Review.aggregate([
            { $match: { isDeleted: false } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        res.render('admin/dashboard', {
            user: req.user,
            stats: {
                totalUsers,
                totalMovies,
                totalReviews,
                totalActors,
                totalDirectors,
                averageRating: averageRating.toFixed(2)
            },
            mostReviewedMovies,
            trendingMovies,
            recentlyAddedMovies,
            moviesByMonth,
            reviewsByMonth
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).render('error', {
            error: 'Error loading dashboard',
            message: error.message,
            user: req.user
        });
    }
};

module.exports = {
    getDashboard
};

