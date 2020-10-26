const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary');
const Campground = require('../models/campground');
const middleware = require('../middleware');
const Comment = require('../models/comment');

const router = express.Router();

const storage = multer.diskStorage({
	filename: function (req, file, callback) {
		callback(null, Date.now() + file.originalname);
	},
});

const imageFilter = function (req, file, cb) {
	// accept image files only
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
		return cb(new Error('Only image files are allowed!'), false);
	}
	cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFilter });

cloudinary.config({
	cloud_name: 'blakevidebeck',
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// INDEX ROUTE - LIST ALL CAMPGROUNDS
router.get('/', async (req, res) => {
	try {
		let noMatch; // equals undefined
		// IF SEARCH DO THIS - ELSE LOAD NORMALLY - FUZZY SEARCH
		if (req.query.search) {
			const regex = new RegExp(middleware.escapeRegex(req.query.search), 'gi');
			Campground.find({ name: regex }, (err, allCampgrounds) => {
				if (err) {
					console.log(err);
				} else {
					if (allCampgrounds.length < 1) {
						noMatch = 'No campgrounds match that query, please try again.';
					}
					res.render('campgrounds/index', { campgrounds: allCampgrounds, noMatch: noMatch });
				}
			});
		} else {
			// GET ALL CAMPGROUNDS FROM DB
			Campground.find({}, (err, allCampgrounds) => {
				if (err) {
					console.log(err);
				} else {
					res.render('campgrounds/index', { campgrounds: allCampgrounds, noMatch: noMatch });
				}
			});
		}
	} catch (err) {
		console.log(err);
	}
});

// NEW ROUTE - SHOWS NEW CAMPGROUND FORM
router.get('/new', middleware.isLoggedIn, (req, res) => {
	const campground = new Campground();
	const method = 'Create new campground';
	const action = '/campgrounds';
	res.render('campgrounds/form', { action, campground, method });
});

// CREATE ROUTE - CREATES NEW CAMPGROUND, THEN REDIRECTS
router.post('/', middleware.isLoggedIn, upload.single('campground[image]'), async (req, res) => {
	try {
		await cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
			// add cloudinary url for the image to the campground object under image property
			req.body.campground.image = result.secure_url;
			// add image's public_id to campground object
			req.body.campground.imageId = result.public_id;
			// add author to campground
			req.body.campground.author = {
				id: req.user._id,
				username: req.user.username,
			};
		});
		const campground = await Campground.create(req.body.campground);
		res.redirect('/campgrounds/' + campground.id);
	} catch (err) {
		req.flash('error', err.message);
		return res.redirect('back');
	}
});

// SHOW ROUTE - SHOW INFO ABOUT ONE SPECIFIC CAMPGROUND
router.get('/:id', async (req, res) => {
	try {
		// find the campground with provided ID
		const campground = await Campground.findById(req.params.id).populate('comments').exec();
		if (!campground) {
			req.flash('error', 'Sorry, that campground does not exist!');
			return res.redirect('/campgrounds');
		}
		// render show template with that campground
		res.render('campgrounds/show', { campground });
	} catch (err) {
		req.flash('error', 'Sorry, that campground does not exist!');
		return res.redirect('/campgrounds');
	}
});

// EDIT ROUTE - SHOW EDIT FORM FOR ONE CAMPGROUND
router.get('/:id/edit', middleware.isLoggedIn, middleware.checkCampgroundOwnership, async (req, res) => {
	try {
		const campground = await Campground.findById(req.params.id);
		const method = `Edit ${campground.name}`;
		const action = `/campgrounds/${campground._id}?_method=PUT`;
		// render edit template with that campground
		res.render('campgrounds/form', { campground, action, method });
	} catch (err) {
		console.log(err.message);
	}
});

// UPDATE ROUTE - UPDATE A CAMPGROUND, THEN REDIRECT
router.put('/:id', upload.single('campground[image]'), async (req, res) => {
	try {
		const campground = await Campground.findById(req.params.id);
		if (req.file) {
			await cloudinary.v2.uploader.destroy(campground.imageId);
			const result = await cloudinary.v2.uploader.upload(req.file.path);
			campground.imageId = result.public_id;
			campground.image = result.secure_url;
		}
		campground.name = req.body.campground.name;
		campground.price = req.body.campground.price;
		campground.description = req.body.campground.description;
		campground.save();
		req.flash('success', 'Successfully Updated!');
		res.redirect('/campgrounds/' + campground._id);
	} catch (err) {
		req.flash('error', err.message);
		return res.redirect('back');
	}
});

// DESTROY ROUTE - DELETE A CAMPGROUND, THEN REDIRECT
router.delete('/:id', middleware.checkCampgroundOwnership, async (req, res, next) => {
	try {
		const campground = await Campground.findById(req.params.id);
		campground.deleteOne();
		cloudinary.v2.uploader.destroy(campground.imageId);
		req.flash('success', 'Campground deleted successfully!');
		res.redirect('/campgrounds');
	} catch (err) {
		req.flash('error', err.message);
		return next(err);
	}
});

module.exports = router;
