const express = require('express');
const router = express.Router();

module.exports = function(userCollection) {

    router.get('/friends', async (req, res) => {
        if (req.session.authenticated) {
            const userName = req.session.username;
            const userEmail = req.session.email;
            const userId = req.session.userId;

            res.render("friends");
        } else {
            res.redirect('/login');
        }
    });

    return router;
};