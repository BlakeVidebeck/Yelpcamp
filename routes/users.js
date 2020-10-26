const express = require('express');
const User = require('../models/user');
const Campground = require('../models/campground');
const middleware = require('../middleware');

const router = express.Router();

// USER PROFILE
router.get('/:id', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		const campgrounds = await Campground.find().where('author.id').equals(user._id).exec();
		if (!user) {
			req.flash('error', 'Sorry, that user does not exist');
			return res.redirect('/campgrounds');
		}
		res.render('users/show', { user, campgrounds });
	} catch (err) {
		req.flash('error', 'Sorry, that user does not exist');
		return res.redirect('/campgrounds');
	}
});

// EDIT ROUTE - SHOW EDIT FORM FOR ONE USER
router.get('/:id/edit', middleware.isLoggedIn, middleware.checkUserOwnership, async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		res.render('users/edit', { user });
	} catch (err) {
		console.log(err.message);
	}
});

// UPDATE ROUTE - UPDATE A USER, THEN REDIRECT
router.put('/:id', middleware.checkUserOwnership, async (req, res) => {
	try {
		await User.findByIdAndUpdate(req.params.id, req.body.user);
		req.flash('success', 'Your profile was successfully updated!');
		res.redirect('/users/' + req.params.id);
	} catch (err) {
		req.flash('error', 'Something went wrong, please try again');
		res.redirect('/users/:id');
	}
});

module.exports = router;
