const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie',
        required: [true, 'Movie is required']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating must be at most 5']
    },
    review: {
        type: String,
        trim: true,
        maxlength: [1000, 'Review cannot exceed 1000 characters']
    },
    isDeleted: {
        type: Boolean,
        default: false // Soft delete for admin
    }
}, {
    timestamps: true
})

// Prevent duplicate reviews from same user for same movie
reviewSchema.index({ movie: 1, user: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review;

