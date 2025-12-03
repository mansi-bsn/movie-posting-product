const mongoose = require('mongoose')

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    genre: {
        type: [String], // Changed to array for multiple genres
        required: [true, 'Genre is required']
    },
    rating: {
        type: Number,
        default: 0, // Will be calculated from reviews
        min: [0, 'Rating must be at least 0'],
        max: [10, 'Rating must be at most 10']
    },
    releaseDate: {
        type: Date,
        required: [true, 'Release date is required']
    },
    // Image fields
    poster: {
        type: String,
        default: null // Main poster image
    },
    gallery: {
        type: [String], // Array of gallery image paths
        default: []
    },
    // New fields for enhanced features
    trailerUrl: {
        type: String,
        default: null // YouTube trailer URL
    },
    director: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Director',
        default: null
    },
    actors: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Actor'
    }],
    // Trending/Popular fields
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    trendingScore: {
        type: Number,
        default: 0 // Calculated based on views, reviews, rating
    },
    // Search fields
    searchKeywords: {
        type: [String], // For search optimization
        default: []
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
})

// Index for search
movieSchema.index({ title: 'text', searchKeywords: 'text' });

const Movie = mongoose.model('Movie', movieSchema)

module.exports = Movie;