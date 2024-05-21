const express = require('express');
const router = express.Router();

module.exports = function(userCollection) {
    router.get('/profile', async (req, res) => {
        res.locals.gameStarted = req.session.gameSession ? true : false;
        if (req.session.authenticated) {
            const userName = req.session.username;
            const userEmail = req.session.email;
            const userId = req.session.userId;

            const user = await userCollection.findOne({ username: userName });
            const userProfilePic = user ? user.profile_pic : 'profile-logo.png';
            const friendsList = user.friendsList; 

            res.render("profile", { userName: userName, userEmail: userEmail, userProfilePic: userProfilePic, userId: userId, friendsList: friendsList });
        } else {
            res.redirect('/login');
        }
    });

    router.use(express.json());

    router.post('/updateProfilePicture', async (req, res) => {
        console.log("Updating profile picture...");
        const { profilePictureUrl } = req.body;
    
        try {
            const userName = req.session.username;
            
            await userCollection.updateOne({ username: userName }, { $set: { profile_pic: profilePictureUrl } });
            req.session.profile_pic = profilePictureUrl;
            res.sendStatus(200); 
        } catch (error) {
            console.error('Error updating profile picture:', error);
            res.sendStatus(500); 
        }
    });

    router.get('/logout', (req,res) => {
        console.log("logging out")
        req.session.destroy();
        res.redirect('/');
    });
    

    return router;
};
