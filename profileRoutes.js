const express = require('express');
const router = express.Router();



module.exports = function(userCollection, userTitlesCollection) {
    router.get('/profile', async (req, res) => {
        const from = req.query.from;
        res.locals.gameStarted = req.session.gameSession ? true : false;
        if (req.session.authenticated) {
            const userName = req.session.username;
            const userEmail = req.session.email;
            const userId = req.session.userId;

            const user = await userCollection.findOne({ username: userName });
            const userProfilePic = user ? user.profile_pic : 'profile-logo.png';
            const friendsList = user.friendsList; 
            const userBio = user.bio;
            const userTitle = user.UserTitle;
            const ownedProfilePics = user ? user.ownedProfilePics : [];
            const goldCollected = user ? user.goldCollected : 0;
            const runsCompleted = user ? user.runsCompleted : 0;
            const damageDealt = user ? user.totalDamageDealt : 0;

            console.log(ownedProfilePics);

            const ownedUserTitles = user ? user.titles : [];

            console.log(ownedUserTitles);
            
            res.render("profile", { goldCollected: goldCollected, runsCompleted: runsCompleted, damageDealt: damageDealt, userName: userName, userEmail: userEmail, userProfilePic: userProfilePic, userId: userId, friendsList: friendsList, userTitle: userTitle, userBio: userBio, ownedProfilePics: ownedProfilePics, ownedUserTitles: ownedUserTitles, from: from });
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

    router.post('/updateProfile', async (req, res) => {
        console.log("Updating profile...");
        const { title, bio } = req.body;
        
        try {
            const userName = req.session.username;

            await userCollection.updateOne(
                { username: userName },
                { $set: { UserTitle: title, bio: bio } }
            );
            console.log("Profile updated successfully");
    
            res.status(200).send({ success: true, message: 'Profile updated successfully' });
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).send({ success: false, message: 'Failed to update profile' });
        }
    });

    router.get('/logout', (req,res) => {
        console.log("logging out")
        req.session.destroy();
        res.redirect('/');
    });
    

    return router;
};
