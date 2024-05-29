// this is a router file for the profile page and related actions
const express = require('express');
const router = express.Router();

// userCollection is the collection of users in the database
module.exports = function (userCollection, userTitlesCollection) {
  router.get('/profile', async (req, res) => {
    // get the from query parameter to determine where the user came from
    const from = req.query.from;
    // check if the game has started
    res.locals.gameStarted = req.session.gameSession ? true : false;

    // if the user is authenticated, render the profile page
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
      const ownedUserTitles = user ? user.titles : [];

      res.render("profile", { goldCollected: goldCollected, runsCompleted: runsCompleted, damageDealt: damageDealt, userName: userName, userEmail: userEmail, userProfilePic: userProfilePic, userId: userId, friendsList: friendsList, userTitle: userTitle, userBio: userBio, ownedProfilePics: ownedProfilePics, ownedUserTitles: ownedUserTitles, from: from });
    } else {
      res.redirect('/login');
    }
  });

  router.use(express.json());

  router.post('/updateProfilePicture', async (req, res) => {
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
    const { title, bio } = req.body;

    try {
      const userName = req.session.username;
      await userCollection.updateOne(
        { username: userName },
        { $set: { UserTitle: title, bio: bio } }
      );
      res.status(200).send({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).send({ success: false, message: 'Failed to update profile' });
    }
  });

  router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
  });

  return router;
};
