const express = require('express');
const router = express.Router();
const ejs = require('ejs')

module.exports = function(userCollection) {

    router.get('/inventory', (req, res) => {
        res.render('inventory');
    });

    return router;
}