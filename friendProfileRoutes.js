const express = require('express');
const router = express.Router();

module.exports = function(userCollection) {

    router.get('/friendProfile', async (req, res) => {
        if (req.session.authenticated) {
            const userName = req.session.username;
            const userEmail = req.session.email;
            const userId = req.session.userId;

            const user = await userCollection.findOne({ username: userName });
            const userProfilePic = user ? user.profile_pic : 'profile-logo.png';
            const friendsList = user.friendsList; 

            res.render("friendProfile", { userName: userName, userEmail: userEmail, userProfilePic: userProfilePic, userId: userId, friendsList: friendsList });
        } else {
            res.redirect('/login');
        }
    });

    return router;
};