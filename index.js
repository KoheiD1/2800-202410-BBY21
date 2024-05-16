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

var { database } = include('databaseConnection');

const userCollection = database.db(mongodb_database).collection('users');
const itemCollection = database.db(mongodb_database).collection('items');
const pathsCollection = database.db(mongodb_database).collection('paths');
const questionCollection = database.db(mongodb_database).collection('questions');
const enemiesCollection = database.db(mongodb_database).collection('enemies');
const levelOneCollection = database.db(mongodb_database).collection('level-1-questions');

app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

const currMap = new ObjectId("663e7a12dad64c6bf7d9f544");

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

const { damageCalculator, coinDistribution, purchaseItem, chooseEnemy } = require('./game');

// Middleware to set the user profile picture and authentication status in the response locals
// res.locals is an object that contains response local variables scoped to the request, and therefore available to the view templates
app.use((req, res, next) => {
	res.locals.userProfilePic = req.session.profile_pic || 'profile-logo.png';
	res.locals.authenticated = req.session.authenticated || false;
	res.locals.playerCoins = req.session.gameSession ? req.session.gameSession.playerCoins : 0;
	res.locals.gameStarted = req.session.gameSession ? true : false;
	next();
});

//Middleware to check if the game session is active
function inGame(req, res, next) {
	if (!req.session.gameSession != null) {
		req.session.gameSession = null;
		res.locals.gameStarted = req.session.gameSession ? true : false;
		next();
	}
	else {
		next();
	}
}

app.get('/', inGame, (req, res) => {
	res.render("index");
});

app.use('/profile', profileRoutes);

app.get('/shop', async (req, res) => {
	let items = await itemCollection.find().toArray();
	let itemsPicked = new Array(3);
	for (let i = 0; i < 3 && i < items.length; i++) {
		let rand;
		do {
			rand = parseInt(Math.random() * items.length);
		} while (items[rand] == null);

		itemsPicked[i] = items[rand];
		items[rand] = null;
	}
	res.render('shop', { item1: itemsPicked[0], item2: itemsPicked[1], item3: itemsPicked[2] });
});

app.get('/startGame', (req, res) => {
	// When the player starts the game it creates a new game session
	req.session.gameSession = {
		playerHealth: 100,
		playerDMG: 5,
		playerInventory: [],
		playerCoins: 0
	}
	res.redirect('/map');
});

app.get('/map', async (req, res) => {
	const result = await pathsCollection.find({ _id: currMap }).project({
		row0: 1, row1: 1, row2: 1, row3: 1, row4: 1,
		r0active: 1, r1active: 1, r2active: 1, r3active: 1, r4active: 1,
		r0connect: 1, r1connect: 1, r2connect: 1, r3connect: 1,
	}).toArray();

	res.render("map", { rows: result[0], id: currMap });
});

app.get('/createUser', (req, res) => {
	res.render("createUser");
});

app.get('/login', (req, res) => {
	res.render("login");
});

var questionID; // Define questionID at the module level to make it accessible across routes

app.post('/startencounter', async (req, res) => {
	// When the player starts the game it creates a new game session
	await levelOneCollection.deleteMany({});
	
	const encounterQuestions = await questionCollection.aggregate([{ $sample: { size: 15 } }]).toArray();

	await levelOneCollection.insertMany(encounterQuestions);

	//console.log("Amount of questions: " + encounterQuestions.length);
	let enemies = await enemiesCollection.find().toArray();
	var enemy = chooseEnemy(req, req.body.difficulty, enemies);

	req.session.battleSession = {
		enemyName: enemy.enemyName,
		enemyHealth: enemy.enemyHealth,
		enemyDMG: enemy.enemyDMG,
		answerdQuestions: [],
		index: req.body.index,
		row: req.body.row,
		difficulty: req.body.difficulty
	};

	//console.log("battleSession: " + JSON.stringify(req.session.battleSession));

	res.redirect('/question');
});

app.get('/question', async (req, res) => {
    try {
        const battleSession = req.session.battleSession;
        const gameSession = req.session.gameSession;

        //console.log("Battle Session: " + JSON.stringify(battleSession));

        battleSession.answeredQuestions = battleSession.answeredQuestions || [];

        const question = await levelOneCollection.aggregate([{ $sample: { size: 1 } }]).next();

        //console.log("answeredQuestions: " + battleSession.answeredQuestions);

        if (!question) {
            res.redirect('/map');
            return;
        }

        await levelOneCollection.deleteOne({ _id: question._id });


        res.render('question', { question: question, enemyHealth: battleSession.enemyHealth, playerHealth: gameSession.playerHealth });
    } catch (error) {
        console.error('Error fetching question:', error);
        res.redirect('/map');
    }
});



app.post('/feedback', async (req, res) => {
	try {
		const { optionIndex, questionID } = req.body;

		//console.log("Option Index: " + optionIndex);
		//console.log("Question ID: " + questionID);

		const parsedQuestionID = new ObjectId(questionID);

		const question = await questionCollection.findOne({ _id: parsedQuestionID });

		if (!question) {
			console.error('No question found for ID:', parsedQuestionID);
			return res.status(404).json({ error: 'No question found' });
		}

		if (!question.options || !Array.isArray(question.options)) {
			console.error('Invalid question data:', question);
			return res.status(500).json({ error: 'Invalid question data' });
		}

		const selectedOption = question.options[optionIndex];

		if (!selectedOption) {
			console.error('Invalid optionIndex:', optionIndex);
			return res.status(500).json({ error: 'Invalid optionIndex' });
		}

		const feedback = selectedOption.feedback || "No feedback available."

		let result = false;

		if (selectedOption.isCorrect === true) {
			result = true;
		}

		damageCalculator(result, req);

		res.json({ feedback: feedback, result: result, enemyHealth: req.session.battleSession.enemyHealth, playerHealth: req.session.gameSession.playerHealth });

	} catch (error) {
		console.error('Error fetching feedback:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

app.post('/submitUser', async (req, res) => {
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;

	const schema = Joi.object(
		{
			username: Joi.string().alphanum().max(20).required(),
			email: Joi.string().email().max(20).required(),
			password: Joi.string().max(20).required()
		});

	const validationResult = schema.validate({ username, email, password });
	if (validationResult.error != null) {
		console.log(validationResult.error);
		res.redirect("/createUser");
		return;
	}

	var hashedPassword = await bcrypt.hash(password, saltRounds);

	await userCollection.insertOne({ username: username, profile_pic: "profile-logo.png", friendsList: [], itemList: [], email: email, password: hashedPassword });
	console.log("Inserted user");

	req.session.authenticated = true;
	req.session.username = username;
	req.session.email = email;
	req.session.cookie.maxAge = expireTime;

	var html = "successfully created user";
	res.redirect('profile');
});

app.post('/loggingin', async (req, res) => {
	var email = req.body.email;
	var password = req.body.password;

	const schema = Joi.string().max(20).required();
	const validationResult = schema.validate(email);
	if (validationResult.error != null) {
		console.log(validationResult.error);
		res.redirect("/login");
		return;
	}

	const result = await userCollection.find({ email: email }).project({ username: 1, password: 1, _id: 1, profile_pic: 1 }).toArray();

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
		req.session.profile_pic = result[0].profile_pic;
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

app.get('/loggedin', (req, res) => {
	if (!req.session.authenticated) {
		res.redirect('/login');
	}
	var html = `You are logged in!`;
	res.send(html);
});

app.get('/logout', (req, res) => {
	req.session.authenticated = false;
	req.session.destroy();
	res.redirect('/');
});

app.post('/encounter', (req, res) => {
	res.render("encounter", { difficulty: req.body.difficulty, index: req.body.index, row: req.body.row });
});

app.get('/victory', async (req, res) => {
	const index = req.session.battleSession.index;
	const row = req.session.battleSession.row;
	const difficulty = req.session.battleSession.difficulty;

	var result = await pathsCollection.find({ _id: currMap }).project({ ['r' + row + 'connect']: 1 }).toArray();
	var arr = result[0]['r' + row + 'connect'][index];
	arr.forEach(async (element) => {
		await pathsCollection.updateOne({ _id: currMap }, { $push: { ['r' + (eval(row) + 1) + 'active']: element } });
	});

	await pathsCollection.updateOne({ _id: currMap },
		{ $set: { ['r' + row + 'active']: [0, 2, 4] } });

	await pathsCollection.updateOne({ _id: currMap },
		{ $set: { ['row' + row + '.0.status']: "notChosen", ['row' + row + '.2.status']: "notChosen", ['row' + row + '.4.status']: "notChosen" } });

	await pathsCollection.updateOne({ _id: currMap },
		{ $set: { ['row' + row + '.' + index + '.status']: "chosen" } });
	res.render("victory");
});

app.post('/mapreset', async (req, res) => {
	var id = req.body.id;
	await pathsCollection.updateOne({ _id: new ObjectId(id) },
		{
			$set: {
				"row0": [
					{ "shape": "empty" },
					{ "shape": "empty" },
					{ "shape": "circle", "status": "chosen" },
					{ "shape": "empty" },
					{ "shape": "empty" }
				],
				"row1": [
					{ "shape": "square", "status": "unvisited" },
					{ "shape": "empty" },
					{ "shape": "triangle", "status": "unvisited" },
					{ "shape": "empty" },
					{ "shape": "square", "status": "unvisited" }
				],
				"row2": [
					{ "shape": "square", "status": "unvisited" },
					{ "shape": "empty" },
					{ "shape": "triangle", "status": "unvisited" },
					{ "shape": "empty" },
					{ "shape": "triangle", "status": "unvisited" }
				],
				"row3": [
					{ "shape": "triangle", "status": "unvisited" },
					{ "shape": "empty" },
					{ "shape": "square", "status": "unvisited" },
					{ "shape": "empty" },
					{ "shape": "pentagon", "status": "unvisited" }
				],
				"row4": [
					{ "shape": "empty" },
					{ "shape": "empty" },
					{ "shape": "hexagon", "status": "unvisited" },
					{ "shape": "empty" },
					{ "shape": "empty" }
				],
				"r0active": [
					2
				],
				"r1active": [
					0,
					2,
					4
				],
				"r2active": [
				],
				"r3active": [
				],
				"r4active": [
				],
				"r0connect": [
					[],
					[],
					[0, 2, 4],
					[],
					[]
				],
				"r1connect": [
					[0, 2],
					[],
					[2],
					[],
					[4]
				],
				"r2connect": [
					[0],
					[],
					[2],
					[],
					[2, 4]
				],
				"r3connect": [
					[2],
					[],
					[2],
					[],
					[2]
				],
				"r4connect": [
					[],
					[],
					[],
					[],
					[]
				]
			}
		});
	res.redirect('/map');
});

app.get('/defeat', (req, res) => {
	res.render("defeat");
});

app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
	res.status(404);
	res.send("Page not found - 404");
});

app.listen(port, () => {
	console.log("Node application listening on port " + port);
}); 