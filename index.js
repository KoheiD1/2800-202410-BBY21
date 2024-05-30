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
const pfpCollection = database.db(mongodb_database).collection('profile-pics');
const achievementsCollection = database.db(mongodb_database).collection('achievements');

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

//Passing in the functions from game.js which are used for the game logic
const { damageCalculator, coinDistribution, chooseEnemy, regenCalculator, enemeyScaling,
	additionalHealth, additionalDMG, coinsWon } = require('./game');

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
	res.render("login" , { success: true });
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
	
	const {schema} = require('./joi-schema');
    const { username, email, password } = req.body;

    const result = schema.validate(req.body, { abortEarly: false });
    if (result.error) {
        console.log("Error");
        res.render("createUser", { errors: result.error.details });
        return;
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        await userCollection.insertOne({
            username,
            profile_pic: "profile-logo.png",
            friendsList: [],
            itemList: [],
            email,
            password: hashedPassword,
            slotsCurrency: 0,
            ownedProfilePics: ["pfp-1.png", "pfp-2.png", "pfp-3.png"],
            titles: ["New around the block"],
						bio: "Click Edit Profile to change your profile",
						UserTitle : "New around the block",
						achievements: [],
						claimedAchievements: []
        });

        req.session.authenticated = true;
        req.session.username = username;
        req.session.email = email;
        req.session.cookie.maxAge = expireTime;

        console.log("Success");
        res.redirect(`/profile?username=${username}`);
    } catch (error) {
        console.error("Database insertion error:", error);
        res.status(500).send("Internal server error");
    }
});

app.post('/loggingin', async (req, res) => {

	const { email, password } = req.body;
	const result = await userCollection.find({ email: email }).project({ username: 1, password: 1, _id: 1, profile_pic: 1 }).toArray();
	if (result.length != 1) {
		res.render("login", { success: false });
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
		res.render("login", { success: false });
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

	req.session.gameSession = {
		mapSet: false,
		playerHealth: 100,
		maxPlayerHealth: 100,
		playerLevel: 0,
		playerDMG: 25,
		playerInventory: [],
		playerCoins: 0,
		gameStarted: true,
		mapID: null,
		totalDamage: 0,
		currentCell: { row: 0, index: 2 }
	};
	
	try {
		await new Promise((resolve, reject) => {
			if (req.session.gameSession) {
				resolve();
			} else {
				reject(new Error('Game session map is not set'));
			}
		});

		res.json({ success: true });
	} catch (error) {
		console.log('Error starting game:', error);
		res.redirect('/startGame')
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

	const currentCell = req.session.gameSession.currentCell;
	console.log("map" + currentCell.row + " " + currentCell.index);

	res.render("map", { path: result[0].path, id: req.session.gameSession.mapID, currentCell: currentCell });
});

app.post('/startencounter', async (req, res) => {

	const battleQuestions = await questionCollection.aggregate([{ $sample: { size: 25 } }]).toArray();

	await userCollection.updateOne({ email: req.session.email }, { $set: { battleQuestions: battleQuestions } });

	/*
	Checks if the player has any additional health or damage from items in their inventory.
	If they do, it adds the additional health and damage to the player's health and damage.
	*/
	additionalHealth(req);
	additionalDMG(req);

	let enemies = await enemiesCollection.find().toArray();

	// Chooses an enemy based on the difficulty of the level
	var enemy = chooseEnemy(req, req.body.difficulty, enemies);

	res.locals.gameStarted = true;

	// Regenerates the player's health based on the items in the player's inventory
	req.session.gameSession.playerHealth = req.session.gameSession.playerHealth + regenCalculator(req);

	if (req.session.gameSession.playerHealth > (req.session.gameSession.maxPlayerHealth)) {
		req.session.gameSession.playerHealth = (req.session.gameSession.maxPlayerHealth);
	}

	req.session.battleSession = {
		enemyName: enemy.enemyName,
		enemyHealth: Math.round((enemy.enemyHealth * enemeyScaling(req))),
		enemyDMG: Math.round((enemy.enemyDMG * enemeyScaling(req))),
		maxEnemyHealth: Math.round((enemy.enemyHealth * enemeyScaling(req))),
		enemyImage: enemy.enemyImage,
		answerdQuestions: [],
		answerStreak: 0,
		index: req.body.index,
		row: req.body.row,
		difficulty: req.body.difficulty,
		coinsReceived: false
	};
	res.redirect('/question');
});

app.get('/question', async (req, res) => {
	try {
		const battleSession = req.session.battleSession;
		const gameSession = req.session.gameSession;
		battleSession.answeredQuestions = battleSession.answeredQuestions || [];

		res.render('question', { enemyHealth: battleSession.enemyHealth, playerHealth: gameSession.playerHealth, maxEnemyHealth: battleSession.maxEnemyHealth, enemyImage: battleSession.enemyImage, enemyName: battleSession.enemyName, userName: req.session.username, difficulty: battleSession.difficulty, maxPlayerHealth: gameSession.maxPlayerHealth, totalDamage: gameSession.totalDamage, playerDMG: gameSession.playerDMG });
	} catch (error) {
		res.redirect('/map');
	}
});

app.get('/getNewQuestion', async (req, res) => {

	const user = await userCollection.findOne({ email: req.session.email });

	const question = user.battleQuestions.pop();

    await userCollection.updateOne({ email: req.session.email }, { $set: { battleQuestions: user.battleQuestions } });
	
	res.json({ question: question });

});

app.post('/updateTotalDamage', async (req, res) => {

	const { playerDMG } = req.body;
	if (!req.session.gameSession) {
		req.session.gameSession = { totalDamage: 0 };
	}
	if (typeof req.session.gameSession.totalDamage !== 'number') {
		req.session.gameSession.totalDamage = 0;
	}
	req.session.gameSession.totalDamage += playerDMG;
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
		if (!result) {
			req.session.battleSession.answerStreak = 0;
		}

		/*
		 Calculate the damage dealt to the enemy or the player 
		 based on the player's answer
		*/
		damageCalculator(result, req);

		if (result) {
			req.session.battleSession.answerStreak++;
		}


		res.json({ feedback: feedback, result: result, enemyHealth: req.session.battleSession.enemyHealth, playerHealth: req.session.gameSession.playerHealth, maxEnemyHealth: req.session.battleSession.maxEnemyHealth, difficulty: req.session.battleSession.difficulty, maxPlayerHealth: req.session.gameSession.maxPlayerHealth });

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
	
	req.session.gameSession.currentCell = { row: row, index: index };

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

	for (var i = 0; i < oldConnections.length; i++) {
		oldConnections[i]++;
	}

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.r' + row + 'connect.' + index]: oldConnections } });

	var prevConnections = await userRunsCollection.findOne({ _id: new ObjectId(req.session.gameSession.mapID) });

	var lastVisitedIndex = prevConnections.path['row' + (row - 1)];

	for (var i = 0; i < lastVisitedIndex.length; i++) {
		if (lastVisitedIndex[i].status == "chosen") {
			lastVisitedIndex = i;
		}
	}
	prevConnections = prevConnections.path['r' + (row - 1) + 'connect']

	if (row == 1) {
		for (var i = 0; i < prevConnections.length; i++) {
			for (var n = 0; n < prevConnections[i].length; n++) {
				if (prevConnections[i][n] == (parseInt(index) + 1)) {

				} else {
					prevConnections[i][n]--;
				}
			}
		}
	}
	else {
		for (var n = 0; n < prevConnections[lastVisitedIndex].length; n++) {
			if (prevConnections[lastVisitedIndex][n] == (parseInt(index) + 1)) {

			} else {
				prevConnections[lastVisitedIndex][n]--;
			}
		}
	}
	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.r' + (row - 1) + 'connect']: prevConnections } });

	res.redirect('/shop');
});

app.get('/victory', async (req, res) => {
	const index = req.session.battleSession.index;
	const row = req.session.battleSession.row;
	
	req.session.gameSession.currentCell = { row: row, index: index };
	const difficulty = req.session.battleSession.difficulty;

	var result = await userRunsCollection.find({ _id: new ObjectId(req.session.gameSession.mapID) }).project({ path: 1 }).toArray();
	var arr = result[0].path['r' + row + 'connect'][index];
	arr.forEach(async (element) => {
		await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) }, { $push: { ['path.r' + (eval(row) + 1) + 'active']: element } });
	});

	//Update player coins based on difficulty of the current level.
	if (req.session.battleSession.coinsReceived == false) {
		req.session.gameSession.playerCoins += coinDistribution(difficulty, req);
		req.session.battleSession.coinsReceived = true;
	}

	/*
	Update the player coins in the response locals so 
	the right amount is displayed on headers.
	*/
	res.locals.playerCoins = req.session.gameSession ? req.session.gameSession.playerCoins : 0;

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.r' + row + 'active']: [0, 2, 4] } });

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.row' + row + '.0.status']: "notChosen", ['path.row' + row + '.2.status']: "notChosen", ['path.row' + row + '.4.status']: "notChosen" } });

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.row' + row + '.' + index + '.status']: "chosen" } });

	var oldConnections = await userRunsCollection.findOne({ _id: new ObjectId(req.session.gameSession.mapID) });

	oldConnections = oldConnections.path['r' + row + 'connect'][index]

	for (var i = 0; i < oldConnections.length; i++) {
		oldConnections[i]++;
	}

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.r' + row + 'connect.' + index]: oldConnections } });

	var prevConnections = await userRunsCollection.findOne({ _id: new ObjectId(req.session.gameSession.mapID) });

	var lastVisitedIndex = prevConnections.path['row' + (row - 1)];

	for (var i = 0; i < lastVisitedIndex.length; i++) {
		if (lastVisitedIndex[i].status == "chosen") {
			lastVisitedIndex = i;
		}
	}

	prevConnections = prevConnections.path['r' + (row - 1) + 'connect']

	if (row == 1) {
		for (var i = 0; i < prevConnections.length; i++) {
			for (var n = 0; n < prevConnections[i].length; n++) {
				if (prevConnections[i][n] == (parseInt(index) + 1)) {
				} else {
					prevConnections[i][n]--;
				}
			}
		}
	}
	else {
		for (var n = 0; n < prevConnections[lastVisitedIndex].length; n++) {
			if (prevConnections[lastVisitedIndex][n] == (parseInt(index) + 1)) {

			} else {
				prevConnections[lastVisitedIndex][n]--;
			}
		}
	}

	await userRunsCollection.updateOne({ _id: new ObjectId(req.session.gameSession.mapID) },
		{ $set: { ['path.r' + (row - 1) + 'connect']: prevConnections } });
	req.session.battleSession.coinsReceived = false;
	await userCollection.updateOne(
		{username: req.session.username}, 
		{$inc: {goldCollected: coinDistribution(difficulty, req)}});

	//setting the coins received to false so the victory page can display the coins won
	req.session.battleSession.coinsReceived = false;
	var result = await userCollection.findOne({ email: req.session.email });

	if(!result.achievements.includes("First Monster Defeated") && !result.claimedAchievements.includes("First Monster Defeated")){
		await userCollection.updateOne({ email: req.session.email }, { $push: { achievements: "First Monster Defeated" } });
		res.render("victory", { coinsWon: coinDistribution(difficulty, req), redirect: "/achievements", page: "Achievements", special: "firstBlood" });
	} else {
		res.render("victory", { coinsWon: coinDistribution(difficulty, req), redirect: "/map", page: "Map", special: "" });
	}
});

app.get('/levelup', async (req, res) => {
	const difficulty = req.session.battleSession.difficulty;
	req.session.battleSession.playerLevel++;

	//if the player has not received coins yet, give them coins
	if (req.session.battleSession.coinsReceived == false) {
		req.session.gameSession.playerCoins += coinDistribution(difficulty, req);
		userCollection.updateOne({ email: req.session.email }, { $inc: { slotsCurrency: 1 } });
		req.session.battleSession.coinsReceived = true;
	}

	/*
	Update the player coins in the response locals so 
	the right amount is displayed in headers.
	*/
	res.locals.playerCoins = req.session.gameSession ? req.session.gameSession.playerCoins : 0;
	

	req.session.gameSession.mapSet = false;

	try {
		const user = req.session.username;

		const goldWon = coinsWon(difficulty);

		const totalDamage = req.session.gameSession.totalDamage;

		await userCollection.updateOne(
			{ username: user },
			{ $inc: { runsCompleted: 1, goldCollected: goldWon, totalDamageDealt: totalDamage } }
		);
	} catch (error) {
		console.error('Error updating user level:', error);
	}
	//setting the coins received to false so the victory page can display the coins won
	req.session.battleSession.coinsReceived = false;
	var result = await userCollection.findOne({ email: req.session.email });

	if(!result.achievements.includes("First Level Up") && !result.claimedAchievements.includes("First Level Up")){
		await userCollection.updateOne({ email: req.session.email }, { $push: { achievements: "First Stage Cleared" } });
		res.render("victory", { coinsWon: coinDistribution(difficulty, req), redirect: "/achievements", page: "Achievements", special: "firstLevelUp" });
	} else {
		res.render("victory", { coinsWon: coinDistribution(difficulty, req), redirect: "/", page: "Main Menu", special: "" });
	}
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

app.get('/gatchapage', async (req, res) => {
	res.render('gatchaPage');
});

app.get('/easteregganimation', async (req, res) => {
	const result = await userCollection.find({ email: req.session.email, username: req.session.username }).project({ slotsCurrency: 1 }).toArray();
	var currency = result[0].slotsCurrency;
	if (currency < 1) {
		res.render('shame');
	} else {
		userCollection.updateOne({ email: req.session.email }, { $inc: { slotsCurrency: -1 } });
		res.render('easteregganimation');
	}
});

app.get('/capsuleopening', async (req, res) => {
	const userEmail = req.session.email;

	const user = await userCollection.findOne({ email: userEmail });
	const ownedTitles = user ? user.titles : [];
	const unownedTitles = [];
	const allTitles = await userTitlesCollection.find().toArray();

	for (let i = 0; i < allTitles.length; i++) {
		const fileName = allTitles[i].title;
		const fileRarity = allTitles[i].rarity;
		if (!ownedTitles.includes(fileName) && fileRarity == "triangle") {
			unownedTitles.push(fileName);
		}
	}

	const result = await userCollection.findOne({ email: userEmail });
	const ownedProfilePics = result ? result.ownedProfilePics : [];
	const unOwnedProfilePics = [];
	const allProfilePic = await pfpCollection.find().toArray();

	for (let i = 0; i < allProfilePic.length; i++) {
		const fileName = allProfilePic[i].src;
		const fileRarity = allProfilePic[i].rarity;
		if (!ownedProfilePics.includes(fileName) && fileRarity == "triangle") {
			unOwnedProfilePics.push(fileName);
		}
	}

	const rewardType = Math.floor(Math.random() * 2);
	let playerReward;

	if (rewardType === 0 && unOwnedProfilePics.length > 0) {
		const rand = Math.floor(Math.random() * unOwnedProfilePics.length);
		playerReward = unOwnedProfilePics[rand];
		await userCollection.updateOne({ email: userEmail }, { $push: { ownedProfilePics: playerReward } });
	} else if (unownedTitles.length > 0) {
		const rand = Math.floor(Math.random() * unownedTitles.length);
		playerReward = unownedTitles[rand];
		await userCollection.updateOne({ email: userEmail }, { $push: { titles: playerReward } });
	} else {
		playerReward = "No rewards available";
	}
	res.render('capsuleopening', { playerReward, rewardType });
});

app.get('/premiumShop', async (req, res) => {
	var pfpArray = await pfpCollection.find({ rarity: { $ne: "triangle" } }).toArray();
	var user = await userCollection.findOne({ email: req.session.email });
	var newArray = [];

	for (let i = 0; i < pfpArray.length; i++) {
		if (!user.ownedProfilePics.includes(pfpArray[i].src)) {
			newArray.push(pfpArray[i]);
		}
	}

	var titlesArray = await userTitlesCollection.find({ rarity: { $ne: "triangle" } }).toArray();
	var newTitles = [];

	for (let i = 0; i < titlesArray.length; i++) {
		if (!user.titles.includes(titlesArray[i].title)) {
			newTitles.push(titlesArray[i]);
		}
	}
	res.render("premiumShop", { pfpList: newArray, titleList: newTitles });
});

app.post('/buyItem', async (req, res) => {
  const item = req.body.item;
  const price = parseInt(req.body.price);
  const userEmail = req.session.email;
  const user = await userCollection.findOne({ email: userEmail });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (user.slotsCurrency < price) {
    return res.status(400).json({ error: "Not enough currency" });
  }

  try {
    if (item.type === 'pfp') {
      await userCollection.updateOne({ email: userEmail }, { $inc: { slotsCurrency: -price }, $push: { ownedProfilePics: item.src } });
    } else if (item.type === 'title') {
      await userCollection.updateOne({ email: userEmail }, { $inc: { slotsCurrency: -price }, $push: { titles: item.title } });
    }
    res.redirect('/profile');
  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get('/achievements', async (req, res) => {
	const achievements = await achievementsCollection.find().toArray();
	const user = await userCollection.findOne({ email: req.session.email });
	const userAchievements = user ? user.achievements : [];
	const userClaimedAchievements = user ? user.claimedAchievements : [];
	var unclaimedAchievements = [];
	var claimedAchievements = [];
	for (let i = 0; i < achievements.length; i++) {
		if (userAchievements.includes(achievements[i].name)) {
			unclaimedAchievements.push(achievements[i]);
		} else if (userClaimedAchievements.includes(achievements[i].name)) {
			claimedAchievements.push(achievements[i]);
		}
	}
	res.render('achievements', { unclaimedAchievements: unclaimedAchievements, claimedAchievements: claimedAchievements });
});

app.post('/claimAchievement', async (req, res) => {
	const achievementName = req.body.achievementName;
	const userEmail = req.session.email;
	if (!req.body.diamonds) {
		const pfp = req.body.pfp;
		await userCollection.updateOne({ email: userEmail }, { $push: { claimedAchievements: achievementName , ownedProfilePics: pfp }, $pull: { achievements: achievementName }});
		res.redirect('/achievements');
	} else {
		const diamonds = req.body.diamonds;
		await userCollection.updateOne({ email: userEmail }, { $push: { claimedAchievements: achievementName }, $inc: { slotsCurrency: diamonds }, $pull: { achievements: achievementName }});
		res.redirect('/achievements');
	}
});

app.get("*", (req, res) => {
	res.status(404);
	res.render('404');
});

app.listen(port, () => {
	console.log("Node application listening on port " + port);
}); 