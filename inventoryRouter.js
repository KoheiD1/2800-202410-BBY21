const express = require('express');
const router = express.Router();
const ejs = require('ejs')

module.exports = function(userCollection) {
    
    let currentPage = 0;

    router.get('/inventory', async (req, res) => {
        if(req.session.gameSession == null) {
            res.redirect('/');
            return;
        }
        res.locals.gameStarted = req.session.gameSession ? true : false;
        res.locals.playerCoins = req.session.gameSession ? req.session.gameSession.playerCoins : 0;
        res.locals.userProfilePic = req.session.profile_pic || 'profile-logo.png';
        let result = req.session.gameSession.playerInventory;
        // await userCollection.find({username: req.session.username}).toArray();
        let items = [];
        for(let i = currentPage * 32; i < result.length; i++) {
            items.push(result[i]);
            if(i == currentPage * 32 + 31) {
                break;
            }
        }

        res.locals.currentPage = currentPage;
        res.render('inventory', {items: result});
    });

    return router;
}