const mongoose = require('mongoose')

const directorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Director name is required'],
        trim: true
    },
    age: {
        type: Number,
        min: [0, 'Age must be positive']
    },
    photo: {
        type: String,
        default: null
    },
    bio: {
        type: String,
        trim: true
    },
    moviesWorkedIn: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie'
    }]
}, {
    timestamps: true
})

const Director = mongoose.model('Director', directorSchema)

module.exports = Director;

