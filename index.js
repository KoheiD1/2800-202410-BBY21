require("./utils.js");
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const ejs = require('ejs')
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 3000;

const app = express();
const shopRouter = require('./shopRouter.js');
const Joi = require("joi");


const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

var {database} = include('databaseConnection');

const userCollection = database.db(mongodb_database).collection('users');
const itemCollection = database.db(mongodb_database).collection('items');

app.use(express.urlencoded({extended: false}));

app.set('view engine', 'ejs');

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
	crypto: {
		secret: mongodb_session_secret
	}
})

app.use(session({ 
    secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true
}
));

const profileRoutes = require('./profileRoutes');
app.use('/', profileRoutes(userCollection));

//app.use('/shop', shopRouter);

app.get('/', (req,res) => {
	if(req.session.authenticated) {
		res.render("index", {loggedIn: req.session.authenticated});
	} else {
    res.render("index", {loggedIn: false});
	}
});

app.use('/profile', profileRoutes);

// app.get('/profile', (req, res) => {
//     if (req.session.authenticated) {
// 		const userName = req.session.username;
// 		const userEmail = req.session.email;
// 		res.render("profile", { userName: userName, userEmail: userEmail });
// 	} else {
// 		res.redirect('/login');
// 	}
// });

app.get('/shop', async (req, res) => {
	let items = await itemCollection.find().toArray();
	let itemsPicked = new Array(3);
	for(let i = 0; i < 3 && i < items.length; i++) {
		let rand;
		do {
			rand = parseInt(Math.random() * items.length);
		} while(items[rand] == null);

		itemsPicked[i] = items[rand];
		items[rand] = null;
	}
	res.render('shop', { item1: itemsPicked[0], item2: itemsPicked[1], item3: itemsPicked[2]});
});

app.get('/map', (req, res) => {
	res.render("map");
});

app.get('/createUser', (req,res) => {
    res.render("createUser");
});

app.get('/login', (req,res) => {
    res.render("login");
});

app.post('/submitUser', async (req,res) => {
    var username = req.body.username;
	var email = req.body.email;
    var password = req.body.password;

	const schema = Joi.object(
		{
			username: Joi.string().alphanum().max(20).required(),
			email: Joi.string().email().max(20).required(),
			password: Joi.string().max(20).required()
		});
	
	const validationResult = schema.validate({username, email, password});
	if (validationResult.error != null) {
	   console.log(validationResult.error);
	   res.redirect("/createUser");
	   return;
   }

    var hashedPassword = await bcrypt.hash(password, saltRounds);
	
	await userCollection.insertOne({username: username, profile_pic: "profile-logo.png", friendsList: [], email: email, password: hashedPassword});
	console.log("Inserted user");

	req.session.authenticated = true;
	req.session.username = username;
	req.session.email = email;
    req.session.cookie.maxAge = expireTime;

    var html = "successfully created user";
    res.redirect('profile');
});

app.post('/loggingin', async (req,res) => {
    var email = req.body.email;
    var password = req.body.password;

	const schema = Joi.string().max(20).required();
	const validationResult = schema.validate(email);
	if (validationResult.error != null) {
	   console.log(validationResult.error);
	   res.redirect("/login");
	   return;
	}

	const result = await userCollection.find({email: email}).project({username: 1, password: 1, _id: 1}).toArray();

	console.log(result);
	if (result.length != 1) {
		console.log("user not found");
		res.redirect("/login");
		return;
	}
	if (await bcrypt.compare(password, result[0].password)) {
		console.log("correct password");
		req.session.authenticated = true;
		req.session.email = email;
		req.session.username = result[0].username;
		req.session.cookie.maxAge = expireTime;

		res.redirect('/profile');
		return;
	}
	else {
		console.log("incorrect password");
		res.redirect("/login");
		return;
	}
});

app.get('/loggedin', (req,res) => {
    if (!req.session.authenticated) {
        res.redirect('/login');
    }
    var html = `
    You are logged in!
    `;
    res.send(html);
});

app.get('/logout', (req,res) => {
    req.session.destroy();
    res.redirect('/');
});

app.post('/encounter', (req,res) => {
	res.render("encounter", {difficulty: req.body.difficulty});
});

app.use(express.static(__dirname + "/public"));

app.get("*", (req,res) => {
	res.status(404);
	res.send("Page not found - 404");
});

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 