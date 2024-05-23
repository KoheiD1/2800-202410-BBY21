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
const userRunsCollection = database.db(mongodb_database).collection('userRuns');
const levelOneCollection = database.db(mongodb_database).collection('level-1-questions');
const userTitlesCollection = database.db(mongodb_database).collection('UserTitles');

app.use(express.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

app.use(express.static(__dirname + "/public/css"));
app.use(express.static(__dirname + "/public/monsters"));
app.use(express.static(__dirname + "/public/profile/pfp"));
app.use(express.static(__dirname + "/public/profile"));
app.use(express.static(__dirname + "/public/mapAssets"));
app.use(express.static(__dirname + "/public/ttf"));
app.use(express.static(__dirname + "/public"));

const currMap = new ObjectId("66467f92599dd72ac79fcec9");

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
app.use('/', profileRoutes(userCollection, userTitlesCollection));

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

const { damageCalculator, coinDistribution, chooseEnemy, resetCoinsReceived, calculateHealth, regenCalculator, itemDamage} = require('./game');

// Middleware to set the user profile picture and authentication status in the response locals
// res.locals is an object that contains response local variables scoped to the request, and therefore available to the view templates
app.use(async (req, res, next) => {
	var username = req.session.username;
	var email = req.session.email;
	res.locals.userProfilePic = req.session.profile_pic || 'profile-logo.png';
	res.locals.authenticated = req.session.authenticated || false;
	res.locals.playerCoins = req.session.gameSession ? req.session.gameSession.playerCoins : 0;
	res.locals.gameStarted = req.session.gameSession ? req.session.gameSession.gameStarted : false;
	const result = await userCollection.find({ email: email, username: username }).project({ slotsCurrency: 1 }).toArray();
	if (result.length > 0) {
		res.locals.slotsCurrency = result[0].slotsCurrency; 
	} 
	next();
});


app.get('/', (req, res) => {
	res.render("index");
});

app.use('/profile', profileRoutes);

app.get('/createUser', (req, res) => {
	res.render("createUser");
});

app.get('/login', (req, res) => {
	res.render("login");
});

const emailRoute = require('./emailRoute');
app.use(express.json());
app.use(emailRoute);

app.get('/forgotPassword', (req, res) => {
	res.render("forgotPassword");
});


app.get('/resetPassword', (req, res) => {
	const token = req.query.token;
	res.render('resetPassword', { token: token });
});

app.post('/submitUser', async (req, res) => {
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;

	const schema = Joi.object(
		{
			username: Joi.string().alphanum().max(20).required(),
			email: Joi.string().email().max(320).required(),
			password: Joi.string().max(20).required()
		});

	const validationResult = schema.validate({ username, email, password });
	if (validationResult.error != null) {
		res.redirect("/createUser");
		return;
	}

	var hashedPassword = await bcrypt.hash(password, saltRounds);

	await userCollection.insertOne({ username: username, profile_pic: "profile-logo.png", friendsList: [], itemList: [], email: email, password: hashedPassword });

	req.session.authenticated = true;
	req.session.username = username;
	req.session.email = email;
	req.session.cookie.maxAge = expireTime;

	res.redirect('profile');
});

app.post('/loggingin', async (req, res) => {
	var email = req.body.email;
	var password = req.body.password;

	const schema = Joi.string().max(320).required();
	const validationResult = schema.validate(email);
	if (validationResult.error != null) {
		res.redirect("/login");
		return;
	}

	const result = await userCollection.find({ email: email }).project({ username: 1, password: 1, _id: 1, profile_pic: 1 }).toArray();

	if (result.length != 1) {
		res.redirect("/login");
		return;
	}
	if (await bcrypt.compare(password, result[0].password)) {
		req.session.authenticated = true;
		req.session.email = email;
		req.session.profile_pic = result[0].profile_pic;
		req.session.username = result[0].username;
		req.session.cookie.maxAge = expireTime;

		res.redirect('/profile');
		return;
	}
	else {
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

app.get('/startGame', async (req, res) => {
	// When the player starts the game it creates a new game session
	req.session.gameSession = await {
		mapSet: false,
		playerHealth: 100,
		maxPlayerHealth: 100,
		playerDMG: 25,
		playerInventory: [],
		playerCoins: 0,
		gameStarted: true,
		mapID: null,
		totalDamage: 0,
	}
	
	try {
		await new Promise((resolve, reject) => {
			if (!req.session.gameSession.mapSet) {
				resolve();
			} else {
				reject(new Error('Game session map is not set'));
			}
		});


        // Check if the map is set
        if (!req.session.gameSession.mapSet) {
            // If not set, redirect to '/map'
            res.redirect('/map');
        } else {
            // If set, redirect to '/'
            res.redirect('/');
        }
    } catch (error) {
        // Handle any errors
        res.redirect('/');
    }
});


app.get('/map', async (req, res) => {
	req.session.shop = null;
	if (!req.session.gameSession.mapSet) {
		const result = await pathsCollection.find({ _id: currMap }).project({
			row0: 1, row1: 1, row2: 1, row3: 1, row4: 1,
			r0active: 1, r1active: 1, r2active: 1, r3active: 1, r4active: 1,
			r0connect: 1, r1connect: 1, r2connect: 1, r3connect: 1,
		}).toArray();

		await userRunsCollection.insertOne({ path: result[0] }).then(result => {
			req.session.gameSession.mapID = result.insertedId;
		});
		await userRunsCollection.updateOne({ _id: req.session.gameSession.mapID }, { $set: { email: req.session.email } });

		req.session.gameSession.mapSet = true;
	}
	var result = await userRunsCollection.find({ _id: new ObjectId(req.session.gameSession.mapID) }).project({ path: 1 }).toArray();
	res.render("map", { path: result[0].path, id: req.session.gameSession.mapID });
});

app.post('/startencounter', async (req, res) => {
	// When the player starts the game it creates a new game session
	await levelOneCollection.deleteMany({});
	const encounterQuestions = await questionCollection.aggregate([{ $sample: { size: 15 } }]).toArray();
	await levelOneCollection.insertMany(encounterQuestions);
	resetCoinsReceived()
	let enemies = await enemiesCollection.find().toArray();
	var enemy = chooseEnemy(req, req.body.difficulty, enemies);
	res.locals.gameStarted = true;

	req.session.gameSession.playerHealth = req.session.gameSession.playerHealth + regenCalculator(req);
	if(req.session.gameSession.playerHealth > (req.session.gameSession.maxPlayerHealth + calculateHealth(req))){
		req.session.gameSession.playerHealth = (req.session.gameSession.maxPlayerHealth + calculateHealth(req));
	}

	req.session.battleSession = {
		enemyName: enemy.enemyName,
		enemyHealth: enemy.enemyHealth,
		enemyDMG: enemy.enemyDMG,
		maxEnemyHealth: enemy.enemyHealth,
		enemyImage: enemy.enemyImage,
		answerdQuestions: [],
		answerStreak: 0,
		index: req.body.index,
		row: req.body.row,
		difficulty: req.body.difficulty
	};
	res.redirect('/question');
});

app.get('/question', async (req, res) => {
	try {
			const battleSession = req.session.battleSession;
			const gameSession = req.session.gameSession;
			battleSession.answeredQuestions = battleSession.answeredQuestions || [];
			const question = await levelOneCollection.aggregate([{ $sample: { size: 1 } }]).next();


			if (!question) {
					res.redirect('/map');
					return;
			}
			await levelOneCollection.deleteOne({ _id: question._id });
			res.render('question', { question: question, enemyHealth: battleSession.enemyHealth, playerHealth: (gameSession.playerHealth + calculateHealth(req)) , maxEnemyHealth: battleSession.maxEnemyHealth, enemyImage: battleSession.enemyImage, enemyName: battleSession.enemyName, userName: req.session.username, difficulty: battleSession.difficulty, maxPlayerHealth: (gameSession.maxPlayerHealth + calculateHealth(req)), totalDamage: gameSession.totalDamage, playerDMG: (gameSession.playerDMG + itemDamage(req)) });
	} catch (error) {
			res.redirect('/map');
	}
});

app.get('/getNewQuestion', async (req, res) => {
	
	const question = await levelOneCollection.aggregate([{ $sample: { size: 1 } }]).next();
	await levelOneCollection.deleteOne({ _id: question._id });


	res.json({ question: question });
	
});

app.post('/updateTotalDamage', async (req, res) => {
	
	const { playerDMG } = req.body;

	console.log("Player Damage Server side: ", playerDMG)

	if (!req.session.gameSession) {
		req.session.gameSession = { totalDamage: 0 };
	  }
	  if (typeof req.session.gameSession.totalDamage !== 'number') {
		req.session.gameSession.totalDamage = 0;
	  }

	
	req.session.gameSession.totalDamage += playerDMG;
	console.log("Total Damage Server side: ", req.session.gameSession.totalDamage);

	res.json({ totalDamage: req.session.gameSession.totalDamage });
	
});

app.post('/feedback', async (req, res) => {
	try {
		const { optionIndex, questionID } = req.body;
		const parsedQuestionID = new ObjectId(questionID);
		const question = await questionCollection.findOne({ _id: parsedQuestionID });

		if (!question) {
			return res.status(404).json({ error: 'No question found' });
		}

		if (!question.options || !Array.isArray(question.options)) {
			return res.status(500).json({ error: 'Invalid question data' });
		}

		const selectedOption = question.options[optionIndex];
		if (!selectedOption) {
			return res.status(500).json({ error: 'Invalid optionIndex' });
		}

		const feedback = selectedOption.feedback || "No feedback available."
		let result = false;

		if (selectedOption.isCorrect === true) {
			result = true;

		}
		if(!result){
			req.session.battleSession.answerStreak = 0;
		}	

		damageCalculator(result, req);

		if(result){
			req.session.battleSession.answerStreak++;
		}

		
		res.json({ feedback: feedback, result: result, enemyHealth: req.session.battleSession.enemyHealth, playerHealth: (req.session.gameSession.playerHealth + calculateHealth(req)), maxEnemyHealth: req.session.battleSession.maxEnemyHealth, difficulty: req.session.battleSession.difficulty, maxPlayerHealth: (req.session.gameSession.maxPlayerHealth + calculateHealth(req))});

	} catch (error) {
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

app.post('/preshop', async (req, res) => {
	req.session.battleSession = {
		index: req.body.index,
		row: req.body.row,
	};
	
	const index = req.session.battleSession.index;
	const row = req.session.battleSession.row;

	var result = await userRunsCollection.find({ _id: new ObjectId(req.session.gameSession.mapID) }).project({ path: 1 }).toArray();
	var arr = result[0].path['r' + row + 'connect'][index];
	arr.forEach(async (element) => {
		await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) }, { $push: { ['path.r' + (eval(row) + 1) + 'active']: element } });
	});

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.r' + row + 'active']: [0, 2, 4] } });

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.row' + row + '.0.status']: "notChosen", ['path.row' + row + '.2.status']: "notChosen", ['path.row' + row + '.4.status']: "notChosen" } });

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.row' + row + '.' + index + '.status']: "chosen" } });
	
	var oldConnections = await userRunsCollection.findOne({ _id: new ObjectId(req.session.gameSession.mapID) });

	oldConnections = oldConnections.path['r' + row + 'connect'][index]

	for (var i = 0; i < oldConnections.length; i++){
		oldConnections[i]++;
	}

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.r' + row + 'connect.'+ index]: oldConnections } });

		var prevConnections = await userRunsCollection.findOne({ _id: new ObjectId(req.session.gameSession.mapID) });

		var lastVisitedIndex = prevConnections.path['row' + (row-1)];
	
		for (var i = 0; i < lastVisitedIndex.length; i++){
			if (lastVisitedIndex[i].status == "chosen"){
				lastVisitedIndex = i;
			}
		}
		prevConnections = prevConnections.path['r' + (row-1) + 'connect']
		
		if (row ==1){
			for (var i = 0; i < prevConnections.length; i++){
				for (var n = 0; n < prevConnections[i].length; n++){
					if (prevConnections[i][n] == (parseInt(index)+1)) {
		
					} else {
						console.log(prevConnections[i][n]);
						console.log(parseInt(index)+1);
						prevConnections[i][n]--;
					}
				}
			}
		}
		else{
			for (var n = 0; n < prevConnections[lastVisitedIndex].length; n++){
				if (prevConnections[lastVisitedIndex][n] == (parseInt(index)+1)) {
	
				} else {
					console.log(prevConnections[lastVisitedIndex][n]);
					console.log(parseInt(index)+1);
					prevConnections[lastVisitedIndex][n]--;
				}
			}
		}
		await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
			{ $set: { ['path.r' + (row-1) + 'connect']: prevConnections } });
	
	res.redirect('/shop');
});

app.get('/victory', async (req, res) => {
	const index = req.session.battleSession.index;
	const row = req.session.battleSession.row;
	const difficulty = req.session.battleSession.difficulty;

	var result = await userRunsCollection.find({ _id: new ObjectId(req.session.gameSession.mapID) }).project({ path: 1 }).toArray();
	var arr = result[0].path['r' + row + 'connect'][index];
	arr.forEach(async (element) => {
		await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) }, { $push: { ['path.r' + (eval(row) + 1) + 'active']: element } });
	});

	//distribute coins depending on difficulty
	coinDistribution(req, difficulty);
	res.locals.playerCoins = req.session.gameSession ? req.session.gameSession.playerCoins : 0;

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.r' + row + 'active']: [0, 2, 4] } });

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.row' + row + '.0.status']: "notChosen", ['path.row' + row + '.2.status']: "notChosen", ['path.row' + row + '.4.status']: "notChosen" } });

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.row' + row + '.' + index + '.status']: "chosen" } });

	var oldConnections = await userRunsCollection.findOne({ _id: new ObjectId(req.session.gameSession.mapID) });

	oldConnections = oldConnections.path['r' + row + 'connect'][index]

	for (var i = 0; i < oldConnections.length; i++){
		oldConnections[i]++;
	}

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.r' + row + 'connect.'+ index]: oldConnections } });

	var prevConnections = await userRunsCollection.findOne({ _id: new ObjectId(req.session.gameSession.mapID) });

	var lastVisitedIndex = prevConnections.path['row' + (row-1)];

	for (var i = 0; i < lastVisitedIndex.length; i++){
		if (lastVisitedIndex[i].status == "chosen"){
			lastVisitedIndex = i;
		}
	}

	prevConnections = prevConnections.path['r' + (row-1) + 'connect']
	
	if (row ==1){
		for (var i = 0; i < prevConnections.length; i++){
			for (var n = 0; n < prevConnections[i].length; n++){
				if (prevConnections[i][n] == (parseInt(index)+1)) {
	
				} else {
					console.log(prevConnections[i][n]);
					console.log(parseInt(index)+1);
					prevConnections[i][n]--;
				}
			}
		}
	}
	else{
		for (var n = 0; n < prevConnections[lastVisitedIndex].length; n++){
			if (prevConnections[lastVisitedIndex][n] == (parseInt(index)+1)) {

			} else {
				console.log(prevConnections[lastVisitedIndex][n]);
				console.log(parseInt(index)+1);
				prevConnections[lastVisitedIndex][n]--;
			}
		}
	}

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.r' + (row-1) + 'connect']: prevConnections } });
	
	res.render("victory");
});

app.get('/levelup', async (req, res) => {
	const difficulty = req.session.battleSession.difficulty;
	coinDistribution(req, difficulty);
	res.locals.playerCoins = req.session.gameSession ? req.session.gameSession.playerCoins : 0;
	userCollection.updateOne({ email: req.session.email }, { $inc: { slotsCurrency: 1 } });

	req.session.gameSession.mapSet = false;

	try {
		const user = req.session.username;

		const goldCollected = req.session.gameSession.playerCoins;

		const totalDamage = req.session.gameSession.totalDamage;
		
		await userCollection.updateOne(
			{ username: user },
			{ $inc: { runsCompleted: 1, goldCollected: goldCollected, totalDamageDealt: totalDamage} }
		);
	} catch (error) {
		console.error('Error updating user level:', error);
	}
	
	res.render("victory");
});

app.get('/defeat', (req, res) => {
	res.locals.gameStarted = false;
	req.session.gameSession.gameStarted = false;
	res.render("defeat");
});

app.post('/mapreset', async (req, res) => {
	res.locals.gameStarted = false;
	req.session.gameSession.gameStarted = false;
	res.redirect('/');
});

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

app.get('/gatchapage', async (req, res) => {
	res.render('gatchaPage');
});

app.get('/easteregganimation', async (req, res) => {
	const result = await userCollection.find({ email: req.session.email, username: req.session.username }).project({ slotsCurrency: 1 }).toArray();
	var currency = result[0].slotsCurrency;
	if(currency < 1){
		res.render('shame');
	}else{
	userCollection.updateOne({ email: req.session.email }, { $inc: { slotsCurrency: -1 } });
	res.render('easteregganimation');
	}
});

app.get('/capsuleopening', async (req, res) => {
	const result = await userCollection.find({ email: req.session.email, username: req.session.username }).project({ ownedProfilePics: 1 }).toArray();
	var unOwnedProfilePics = [];
	var owned = false;

	for (let i = 1; i <= 4; i++){
		owned = false;
		for(let j = 0; j < result[0].ownedProfilePics.length; j++){
			if(result[0].ownedProfilePics[j] == 'pfp-' + i + '.png'){
				owned = true;
			}
		}
		if(!owned){
			unOwnedProfilePics.push('pfp-' + i + '.png');
		}
	}

	var rand = Math.floor(Math.random() * unOwnedProfilePics.length);
	userCollection.updateOne({ email: req.session.email }, { $push: { ownedProfilePics: unOwnedProfilePics[rand] } });
	res.render('capsuleopening', {playerReward: unOwnedProfilePics[rand]});
});


app.get("*", (req, res) => {
	res.status(404);
	res.send("Page not found - 404");
});

app.listen(port, () => {
	console.log("Node application listening on port " + port);
}); 