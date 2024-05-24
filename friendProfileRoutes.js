const express = require('express');
const router = express.Router();

module.exports = function(userCollection) {
    router.get('/friendProfile', async (req, res) => {
        try {
            const currentUser = req.session.username;
            const friendName = req.query.friendName;
            const source = req.query.source;

            const currentUserDoc = await userCollection.findOne({ username: currentUser });
            if (!currentUserDoc) {
                return res.status(404).send('User not found');
            }

            const isFriend = currentUserDoc.friendsList.includes(friendName);

            const friend = await userCollection.findOne({ username: friendName });
            const friendProfilePic = friend ? friend.profile_pic : 'profile-logo.png';
            const friendBio = friend ? friend.bio : '';
            const friendTitle = friend ? friend.UserTitle : '';
            const friendGold = friend ? friend.goldCollected : 0;
            const friendRuns = friend ? friend.runsCompleted : 0;
            const friendDamage = friend ? friend.totalDamageDealt : 0;

            if (req.session.authenticated) {
                res.render("friendProfile", { 
                    friendName: friendName, 
                    userProfilePic: friendProfilePic, 
                    currentUser: currentUser,
                    isFriend: isFriend,
                    source: source,
                    friendBio: friendBio,
                    friendTitle: friendTitle,
                    friendGold: friendGold,
                    friendRuns: friendRuns,
                    friendDamage: friendDamage

                });
            } else {
                res.redirect('/login');
            }
        } catch (error) {
            console.error('Error in friendProfile route:', error);
            res.status(500).send('Internal Server Error');
        }
    });

router.post('/toggleFriend', async (req, res) => {
    try {
        const currentUser = req.session.username;
        const { username } = req.body;

        // Retrieve current user's document
        const currentUserDoc = await userCollection.findOne({ username: currentUser });
        if (!currentUserDoc) {
            return res.status(404).send('User not found');
        }

        const isFriend = currentUserDoc.friendsList.includes(username);

        if (isFriend) {
            await userCollection.updateOne({ username: currentUser }, { $pull: { friendsList: username } });
            res.status(200).send({ removed: true }); 
        } else {
            await userCollection.updateOne({ username: currentUser }, { $addToSet: { friendsList: username } });
            res.status(200).send({ removed: false }); 
        }
    } catch (error) {
        console.error('Error toggling friend status:', error);
        res.status(500).send('Internal Server Error');
    }
});


    router.post('/addFriend', async (req, res) => {
        try {
            if (!req.session.authenticated) {
                return res.redirect('/login');
            }

            const { username } = req.body;
            const currentUser = req.session.username;

            const user = await userCollection.findOne({ username: currentUser });
            const friendsList = user.friendsList;

            if (friendsList.includes(username)) {
                console.log('Friend already exists');
                return res.sendStatus(200);
            }

            friendsList.push(username);

            await userCollection.updateOne({ username: currentUser }, { $set: { friendsList: friendsList } });

            res.sendStatus(200);
        } catch (err) {
            console.error('Error adding friend:', err);
            res.status(500).send('Internal Server Error');
        }
    });

    router.get('/isFriend', async (req, res) => {
        try {
            const currentUser = req.session.username;
            const { friendName } = req.query;

            const currentUserDoc = await userCollection.findOne({ username: currentUser });
            if (!currentUserDoc) {
                return res.status(404).send('User not found');
            }

            const isFriend = currentUserDoc.friendsList.includes(friendName);

            res.json({ isFriend: isFriend });
        } catch (error) {
            console.error('Error checking friend status:', error);
            res.status(500).send('Internal Server Error');
        }
    });
    
    return router;
};

