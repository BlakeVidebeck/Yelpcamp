const express = require('express');
const Campground = require('../models/campground');
const Comment = require('../models/comment');
const middleware = require('../middleware');

const router = express.Router({ mergeParams: true });

// COMMENTS CREATE ROUTE
router.post('/', middleware.isLoggedIn, async (req, res) => {
	try {
		const campground = await Campground.findById(req.params.id);
		const comment = await Comment.create(req.body.comment);
		// add username and id to comment
		comment.author.id = req.user._id;
		comment.author.username = req.user.username;
		comment.author.avatar = req.user.avatar;
		// save comment
		comment.save();
		campground.comments.push(comment);
		campground.save();
		res.redirect('/campgrounds/' + campground._id + '/#comments');
	} catch (err) {
		req.flash('error', 'Something went wrong');
		console.log(err.message);
		res.redirect('/campgrounds');
	}
});

// COMMENT UPDATE ROUTE
router.put('/:comment_id', middleware.checkCommentOwnership, async (req, res) => {
	try {
		await Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment);
		res.redirect('/campgrounds/' + req.params.id + '/#comments');
	} catch (error) {
		res.redirect('back');
	}
});

// COMMENT DESTROY ROUTE
router.delete('/:comment_id', middleware.checkCommentOwnership, async (req, res) => {
	try {
		await Comment.findByIdAndRemove(req.params.comment_id);
		req.flash('success', 'Comment successfully deleted');
		res.redirect('/campgrounds/' + req.params.id);
	} catch (error) {
		console.log(error.message);
		res.redirect('back');
	}
});

module.exports = router;
