const express = require('express');
const router = express.Router();

module.exports = function(userCollection) {
   
    router.get('/findFriends', async (req, res) => {
        try {
            if (!req.session.authenticated) {
                return res.redirect('/login');
            }
    
            const currentUser = req.session.username;
    
            const currentUserDocument = await userCollection.findOne({ username: currentUser });
            const friendsList = currentUserDocument.friendsList || [];
    
            const recentlyAddedUsers = req.session.recentlyAddedUsers || [];
    
            // Exclude the current user and their friends from the search
            const excludedUsers = [...friendsList, ...recentlyAddedUsers, currentUser];
    
            const documents = await userCollection.find(
                { 
                    username: { $nin: excludedUsers }
                },
                { projection: { _id: 0, username: 1, profile_pic: 1 } }
            ).toArray();
    
            res.render("findFriends", { allUsers: documents });
        } catch (err) {
            console.error('Error finding documents:', err);
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

    return router;
};
