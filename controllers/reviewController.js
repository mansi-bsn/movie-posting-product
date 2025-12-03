const Review = require('../models/reviews');
const Movie = require('../models/movies');

// Create or update review
const createReview = async (req, res) => {
    try {
        const { movieId, rating, review } = req.body;
        const userId = req.user._id;
        
        // Validation
        if (!movieId || !rating) {
            return res.status(400).json({ error: 'Movie ID and rating are required' });
        }
        
        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        
        // Check if review already exists
        let existingReview = await Review.findOne({ movie: movieId, user: userId });
        
        if (existingReview) {
            // Update existing review
            existingReview.rating = ratingNum;
            existingReview.review = review || '';
            existingReview.isDeleted = false;
            await existingReview.save();
        } else {
            // Create new review
            existingReview = new Review({
                movie: movieId,
                user: userId,
                rating: ratingNum,
                review: review || ''
            });
            await existingReview.save();
        }
        
        // Update movie average rating
        await updateMovieRating(movieId);
        
        res.json({ success: true, review: existingReview });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'Error creating review' });
    }
};

// Get reviews for a movie
const getMovieReviews = async (req, res) => {
    try {
        const { movieId } = req.params;
        const reviews = await Review.find({ movie: movieId, isDeleted: false })
            .populate('user', 'username')
            .sort({ createdAt: -1 });
        
        res.json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Error fetching reviews' });
    }
};

// Delete review (admin only)
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await Review.findById(reviewId);
        
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        
        // Soft delete
        review.isDeleted = true;
        await review.save();
        
        // Update movie rating
        await updateMovieRating(review.movie);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'Error deleting review' });
    }
};

// Helper function to update movie average rating
const updateMovieRating = async (movieId) => {
    try {
        const reviews = await Review.find({ movie: movieId, isDeleted: false });
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;
        
        // Convert to 10-point scale for display
        const rating10 = (avgRating / 5) * 10;
        
        await Movie.findByIdAndUpdate(movieId, { rating: rating10 });
    } catch (error) {
        console.error('Error updating movie rating:', error);
    }
};

module.exports = {
    createReview,
    getMovieReviews,
    deleteReview
};

