const mongoose = require('mongoose');

const db = () => {
    mongoose.connect('mongodb://localhost:27017/movie-posting-product')
    .then(() => {
        console.log("Mongodb connected successfully...")
    })
    .catch((err) => {
        console.log("Database connection failed", err)
    })
}

module.exports = db