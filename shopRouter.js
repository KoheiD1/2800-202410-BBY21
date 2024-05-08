const express = require('express');
const router = express.Router();
const ejs = require('ejs')

router.get('/shop', (req, res) => {
    res.render(shop);
});