const express = require('express');
const router = express.Router();

module.exports = function(userCollection) {

    router.get('/friends', async (req, res) => {
        if (req.session.authenticated) {
            const userName = req.session.username;

            const user = await userCollection.findOne({ username: userName });
            const friendsList = user.friendsList;
            
            res.render("friends", { friendsList: friendsList });
        } else {
            res.redirect('/login');
        }
    });

    return router;
};