// REQUIRED APIs
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');
require('dotenv').config();

// REQUIRED MODELS
const User = require('./models/user');

const app = express();

// REQUIRED ROUTES
const campgroundRoutes = require('./routes/campgrounds');
const commentRoutes = require('./routes/comments');
const indexRoutes = require('./routes/index');
const userRoutes = require('./routes/users');

// DATABASE CONFIG
// SERVER PORT || LOCAL PORT
const port = process.env.PORT || 3000;
// DATABASE DEFINE IN .ENV OR HEROKU
const database = process.env.DATABASE;

mongoose
	.connect(database, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		console.log('Connected to DB');
	})
	.catch(err => {
		console.log('ERROR: ', err.message);
	});

// APP CONFIG
mongoose.set('useFindAndModify', false);
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));
app.use(flash());
// REQUIRE MOMENT FOR RELATIVE TIME CREATED
app.locals.moment = require('moment');
// seedDB(); // SEED THE DATABASE

// PASSPORT CONFIG
app.use(
	require('express-session')({
		secret: process.env.SECRET,
		resave: false,
		saveUninitialized: false,
	}),
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// APP.USE WILL BE CALLED ON EVERY ROUTE
app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');
	next();
});

// TELLS APP TO USE THESE ROUTE FILES
app.use('/', indexRoutes);
app.use('/campgrounds/:id/comments', commentRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/users', userRoutes);

// LISTEN FOR THE NODE APP.JS TO START THE SERVER
app.listen(port, process.env.IP, () => {
	console.log('The YelpCamp has started on port ' + port);
});
