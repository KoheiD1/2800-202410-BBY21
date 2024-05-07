const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const port = process.env.PORT || 3000;

const app = express();
const profileRoutes = require('./profileRoutes');


app.use('/profile', profileRoutes);


const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* END secret section */

// var {database} = include('databaseConnection');

app.set('view engine', 'ejs');

// var mongoStore = MongoStore.create({
// 	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
// 	crypto: {
// 		secret: mongodb_session_secret
// 	}
// })

// app.use(session({ 
//     secret: node_session_secret,
// 	//store: mongoStore, //default is memory store 
// 	saveUninitialized: false, 
// 	resave: true
// }
// ));

app.get('/', (req,res) => {
    var color = req.query.color;

    res.render("index", {color: color});
});

app.get('/map', (req, res) => {
	res.render("map");
});

app.use(express.static(__dirname + "/public"));

app.get("*", (req,res) => {
	res.status(404);
	res.send("Page not found - 404");
});

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 