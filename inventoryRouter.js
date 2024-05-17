const express = require('express');
const router = express.Router();
const ejs = require('ejs')

module.exports = function(userCollection) {

    router.get('/inventory', async (req, res) => {
        res.locals.gameStarted = req.session.gameSession ? true : false;
        res.locals.playerCoins = req.session.gameSession ? req.session.gameSession.playerCoins : 0;
        res.locals.userProfilePic = req.session.profile_pic || 'profile-logo.png';
        let result = req.session.gameSession.playerInventory;
        // await userCollection.find({username: req.session.username}).toArray();
        res.render('inventory', {items: result});
    });

    return router;
}