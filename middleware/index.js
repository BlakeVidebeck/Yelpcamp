const Campground = require('../models/campground');
const Comment = require('../models/comment');
const User = require('../models/user');

module.exports = {
	// MIDDLEWARE
	isLoggedIn: (req, res, next) => {
		if (req.isAuthenticated()) {
			return next();
		}
		// key and a value for flash to work
		req.flash('error', 'You need to be logged in to do that!');
		res.redirect('/login');
	},

	checkCampgroundOwnership: (req, res, next) => {
		if (req.isAuthenticated()) {
			Campground.findById(req.params.id, (err, foundCampground) => {
				if (err || !foundCampground) {
					req.flash('error', 'Campground not found');
					res.redirect('back');
					// does the user own the campground
				} else if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash('error', "You don't have permission to do that");
					res.redirect('back');
				}
			});
		} else {
			req.flash('error', 'You need to be logged in to do that!');
			res.redirect('back');
		}
	},

	checkCommentOwnership: (req, res, next) => {
		if (req.isAuthenticated()) {
			Comment.findById(req.params.comment_id, (err, foundComment) => {
				if (err || !foundComment) {
					req.flash('error', 'Sorry, that comment does not exist!');
					res.redirect('/campgrounds');
					// does the user own the comment?
				} else if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash('error', "You don't have permission to do that!");
					res.redirect('/campgrounds/' + req.params.id);
				}
			});
		} else {
			req.flash('error', 'You need to be logged in to do that!');
			res.redirect('back');
		}
	},

	checkUserOwnership: (req, res, next) => {
		if (req.isAuthenticated()) {
			User.findById(req.params.id, (err, foundUser) => {
				if (err || !foundUser) {
					req.flash('error', 'Sorry, that user does not exist!');
					res.redirect('/campgrounds');
				} else if (foundUser._id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash('error', "You don't have permission to do that!");
					res.redirect('/users/' + req.params.id);
				}
			});
		} else {
			req.flash('error', 'You need to be logged in to do that!');
			res.redirect('back');
		}
	},

	// function taken from stack overflow
	escapeRegex: text => {
		return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
	},
};
