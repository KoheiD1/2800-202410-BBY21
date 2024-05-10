const express = require('express');
const router = express.Router();
const ejs = require('ejs')

module.exports = function(userCollection) {

    router.get('/inventory', async (req, res) => {
        let result = await userCollection.find({username: req.session.username}).toArray();
        console.log(result[0].itemList);
        res.render('inventory', {items: result[0].itemList});
    });

    return router;
}