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
//const profileRoutes = require('./profileRoutes');
// const shopRouter = require('./shopRouter.js');
const Joi = require("joi");

const { ObjectId } = require('mongodb');

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
const pathsCollection = database.db(mongodb_database).collection('paths');

app.use(express.urlencoded({extended: false}));

app.set('view engine', 'ejs');

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
	crypto: {
		secret: mongodb_session_secret
	}
})

var gameStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/gameSessions`,
	crypto: {
		secret: mongodb_session_secret
	}
})

var battleStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/battleSessions`,
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

app.use(session({
	name: 'gameSession', 
    secret: node_session_secret,
	store: gameStore, 
	saveUninitialized: false, 
	resave: true
}
));

app.use(session({
	name: 'battleSession', 
    secret: node_session_secret,
	store: gameStore, 
	saveUninitialized: false, 
	resave: true
}
));

const profileRoutes = require('./profileRoutes');
app.use('/', profileRoutes(userCollection));

const friendProfileRoutes = require('./friendProfileRoutes');
app.use('/', friendProfileRoutes(userCollection));

const friendsRoutes = require('./friendsRoutes');
app.use('/', friendsRoutes(userCollection));

const findFriendsRoutes = require('./findFriendsRoutes');
app.use('/', findFriendsRoutes(userCollection));

const shopRouter = require('./shopRouter');
app.use('/', shopRouter(itemCollection, userCollection));

const inventoryRouter = require('./inventoryRouter');
app.use('/', inventoryRouter(userCollection));

app.get('/', (req,res) => {
	if(req.session.authenticated) {
		res.render("index", {loggedIn: req.session.authenticated});
	} else {
    res.render("index", {loggedIn: false});
	}
});

app.use('/profile', profileRoutes);


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

app.get('/map', async (req, res) => {
	const result = await pathsCollection.find({_id: new ObjectId("663e7a12dad64c6bf7d9f544")}).project({row0: 1, row1: 1, row2: 1, row3: 1, row4: 1,
		r0active:1, r1active:1, r2active:1, r3active:1, r4active:1,
		r0connect: 1, r1connect: 1
	}).toArray();
	// res.send(result[0].row1);
	req.gameSession.health = 1000;
	req.gameSession.gold = 0;
	req.gameSession.inventory = [];
	req.gameSession.answeredQuestions = [];
	req.gameSession.playerDamage = 5;

	res.render("map", 
	{rows: result[0]});
});

app.get('/createUser', (req,res) => {
    res.render("createUser");
});

app.get('/login', (req,res) => {
    res.render("login");
});

var questionID; // Define questionID at the module level to make it accessible across routes

app.get('/question', async (req, res) => {
    try {
        // Fetch random question from the MongoDB collection
        const question = await database.db(mongodb_database).collection('questions').aggregate([{ $sample: { size: 1 } }]).next();
        questionID = question._id; // Assign the fetched question's ID to questionID
				console.log(questionID);
        res.render('question', { question: question });
    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/feedback', async (req, res) => {
    try {
        // Check if questionID is defined
        if (!questionID) {
            console.error('No question ID available');
            return res.status(404).send('No question ID available');
        }

        const { option } = req.body;
        
        // Fetch the selected question based on the stored question ID
        const question = await database.db(mongodb_database).collection('questions').findOne({ _id: questionID });
				console.log(question);
        if (!question) {
            console.error('No question found for ID:', questionID);
            return res.status(404).send('No question found');
        }

        // Get the feedback for the selected option
        const selectedOption = question.options[option];
				console.log(selectedOption);
        if (!selectedOption) {
            console.error('No option found for index:', option);
            return res.status(404).send('No option found');
        }
				console.log(selectedOption.feedback);
        // Render the feedback.ejs template with the feedback for the selected option
        res.render('feedback', { feedback: selectedOption.feedback, isCorrect: selectedOption.isCorrect});
				
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).send('Internal Server Error');
    }
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
	
	await userCollection.insertOne({username: username, profile_pic: "profile-logo.png", friendsList: [], itemList: [], email: email, password: hashedPassword});
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
	res.render("encounter", {difficulty: req.body.difficulty, index: req.body.index});
});

app.post('/victory', async (req,res) => {
	const index = req.body.index;
	const row = req.body.row;

	var result = await pathsCollection.find({_id: new ObjectId("663e7a12dad64c6bf7d9f544")}).project({r1connect: 1}).toArray();
	var arr = result[0].r1connect[index];
	arr.forEach(async (element) => {
		await pathsCollection.updateOne({_id: new ObjectId("663e7a12dad64c6bf7d9f544")},
			{$push: {"r2active" : element}
		});
	});


	await pathsCollection.updateOne({_id: new ObjectId("663e7a12dad64c6bf7d9f544")},
		{$set: {"row1.0.status" : "notChosen", "row1.2.status" : "notChosen", "row1.4.status" : "notChosen"}
	});
	await pathsCollection.updateOne({_id: new ObjectId("663e7a12dad64c6bf7d9f544")},
		{$set: {["row1."+index+".status"] : "chosen"}
	});
	
		res.render("victory");
});	

app.use(express.static(__dirname + "/public"));

app.get("*", (req,res) => {
	res.status(404);
	res.send("Page not found - 404");
});

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 