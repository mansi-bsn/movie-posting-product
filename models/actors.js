const mongoose = require('mongoose')

const actorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Actor name is required'],
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

const Actor = mongoose.model('Actor', actorSchema)

module.exports = Actor;

