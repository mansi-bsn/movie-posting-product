const Actor = require('../models/actors');
const Movie = require('../models/movies');
const fs = require('fs');
const path = require('path');

// Get all actors
const getAllActors = async (req, res) => {
    try {
        const actors = await Actor.find().sort({ name: 1 });
        res.render('actors/list', { actors, user: req.user });
    } catch (error) {
        console.error('Error fetching actors:', error);
        res.status(500).render('actors/list', { actors: [], user: req.user });
    }
};

// Get actor detail
const getActorDetail = async (req, res) => {
    try {
        const actor = await Actor.findById(req.params.id)
            .populate('moviesWorkedIn', 'title poster releaseDate');
        
        if (!actor) {
            return res.status(404).redirect('/actors');
        }
        
        res.render('actors/detail', { actor, user: req.user });
    } catch (error) {
        console.error('Error fetching actor:', error);
        res.status(500).redirect('/actors');
    }
};

// Show add actor form
const showAddForm = (req, res) => {
    res.render('actors/add', { user: req.user, error: null, actor: null });
};

// Create actor
const createActor = async (req, res) => {
    try {
        const { name, age, bio } = req.body;
        
        if (!name) {
            return res.status(400).render('actors/add', {
                user: req.user,
                error: 'Name is required',
                actor: req.body
            });
        }
        
        let photoPath = null;
        if (req.file) {
            photoPath = '/uploads/actors/' + req.file.filename;
        }
        
        const actor = new Actor({
            name,
            age: age ? parseInt(age) : null,
            bio,
            photo: photoPath
        });
        
        await actor.save();
        res.redirect('/actors');
    } catch (error) {
        console.error('Error creating actor:', error);
        if (req.file) {
            const filePath = path.join(__dirname, '../public/uploads/actors', req.file.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        res.status(500).render('actors/add', {
            user: req.user,
            error: 'Error creating actor',
            actor: req.body
        });
    }
};

module.exports = {
    getAllActors,
    getActorDetail,
    showAddForm,
    createActor
};

