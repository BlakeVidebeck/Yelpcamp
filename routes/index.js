const express = require('express');
const passport = require('passport');
const User = require('../models/user');

const router = express.Router();

// HOME PAGE
router.get('/', (req, res) => {
	res.render('landing');
});

// SHOW REGISTER FORM
router.get('/register', (req, res) => {
	res.render('register');
});

// HANDLE SIGN UP LOGIC
router.post('/register', (req, res) => {
	const newUser = new User({
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		avatar: req.body.avatar,
		description: req.body.description,
	});

	if (!newUser.avatar) {
		newUser.avatar = 'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_1280.png';
	}

	if (req.body.adminCode === process.env.ADMINCODE) {
		newUser.isAdmin = true;
	}

	User.register(newUser, req.body.password, (err, user) => {
		if (err) {
			req.flash('error', err.message);
			return res.redirect('/register');
		}
		passport.authenticate('local')(req, res, () => {
			req.flash('success', 'Welcome to YelpCamp ' + user.username + '!');
			res.redirect('/campgrounds');
		});
	});
});

// SHOW LOGIN FORM
router.get('/login', (req, res) => {
	res.render('login');
});

// HANDLING LOGIN LOGIC
router.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/campgrounds',
		failureRedirect: '/login',
	}),
	(req, res) => {},
);

// LOGOUT ROUTE
router.get('/logout', (req, res) => {
	req.logout();
	req.flash('success', 'Logged you out!');
	res.redirect('/campgrounds');
});

module.exports = router;
