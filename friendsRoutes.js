const express = require('express');
const router = express.Router();

module.exports = function(userCollection) {

    router.get('/friends', async (req, res) => {
        if (req.session.authenticated) {
            const userName = req.session.username;

            const user = await userCollection.findOne({ username: userName });
            const friendsList = user.friendsList;
            
            var documents = [];

            for (var i=0; i<friendsList.length; i++) {
                var temp =  await userCollection.find(
                    {  username: friendsList[i] },
                    { projection: { _id: 0, username: 1, profile_pic: 1 } }
                ).toArray();
                documents.push(temp);
            }

            res.render("friends", { friendsList: documents[0] });
        } else {
            res.redirect('/login');
        }
    });

    return router;
};