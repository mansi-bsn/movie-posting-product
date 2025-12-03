const User = require('../models/users');
const Movie = require('../models/movies');
const Review = require('../models/reviews');

// Toggle watchlist (add/remove)
const toggleWatchlist = async (req, res) => {
    try {
        const { movieId } = req.body;
        const userId = req.user._id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const movieIndex = user.watchlist.indexOf(movieId);
        let inWatchlist = false;
        
        if (movieIndex > -1) {
            // Remove from watchlist
            user.watchlist.splice(movieIndex, 1);
        } else {
            // Add to watchlist
            user.watchlist.push(movieId);
            inWatchlist = true;
        }
        
        await user.save();
        res.json({ success: true, inWatchlist });
    } catch (error) {
        console.error('Error toggling watchlist:', error);
        res.status(500).json({ error: 'Error updating watchlist' });
    }
};

// Get user's watchlist
const getWatchlist = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'watchlist',
            populate: [
                { path: 'director', select: 'name' },
                { path: 'actors', select: 'name' }
            ]
        });
        
        if (!user) {
            return res.status(404).redirect('/login');
        }
        
        // Calculate ratings for each movie
        for (let movie of user.watchlist) {
            const reviews = await Review.find({ movie: movie._id, isDeleted: false });
            movie.averageRating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;
        }
        
        res.render('watchlist', {
            movies: user.watchlist,
            user: req.user
        });
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).redirect('/movies');
    }
};

module.exports = {
    toggleWatchlist,
    getWatchlist
};

