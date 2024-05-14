const express = require('express');
const router = express.Router();
const ejs = require('ejs')

module.exports = function(userCollection) {

    router.get('/inventory', async (req, res) => {
        let result = req.session.gameSession.playerInventory;
        // await userCollection.find({username: req.session.username}).toArray();
        res.render('inventory', {items: result});
    });

    return router;
}