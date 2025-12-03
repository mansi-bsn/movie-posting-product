const Director = require('../models/directors');
const Movie = require('../models/movies');
const fs = require('fs');
const path = require('path');

// Get all directors
const getAllDirectors = async (req, res) => {
    try {
        const directors = await Director.find().sort({ name: 1 });
        res.render('directors/list', { directors, user: req.user });
    } catch (error) {
        console.error('Error fetching directors:', error);
        res.status(500).render('directors/list', { directors: [], user: req.user });
    }
};

// Get director detail
const getDirectorDetail = async (req, res) => {
    try {
        const director = await Director.findById(req.params.id)
            .populate('moviesWorkedIn', 'title poster releaseDate');
        
        if (!director) {
            return res.status(404).redirect('/directors');
        }
        
        res.render('directors/detail', { director, user: req.user });
    } catch (error) {
        console.error('Error fetching director:', error);
        res.status(500).redirect('/directors');
    }
};

// Show add director form
const showAddForm = (req, res) => {
    res.render('directors/add', { user: req.user, error: null, director: null });
};

// Create director
const createDirector = async (req, res) => {
    try {
        const { name, age, bio } = req.body;
        
        if (!name) {
            return res.status(400).render('directors/add', {
                user: req.user,
                error: 'Name is required',
                director: req.body
            });
        }
        
        let photoPath = null;
        if (req.file) {
            photoPath = '/uploads/directors/' + req.file.filename;
        }
        
        const director = new Director({
            name,
            age: age ? parseInt(age) : null,
            bio,
            photo: photoPath
        });
        
        await director.save();
        res.redirect('/directors');
    } catch (error) {
        console.error('Error creating director:', error);
        if (req.file) {
            const filePath = path.join(__dirname, '../public/uploads/directors', req.file.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        res.status(500).render('directors/add', {
            user: req.user,
            error: 'Error creating director',
            director: req.body
        });
    }
};

module.exports = {
    getAllDirectors,
    getDirectorDetail,
    showAddForm,
    createDirector
};

