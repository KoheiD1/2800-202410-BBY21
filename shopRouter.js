const express = require('express');
const router = express.Router();
const ejs = require('ejs');

router.use(express.urlencoded({extended: false}));


module.exports = function(itemCollection, userCollection) {
    router.get('/shop', async (req, res) => {
        if(req.session.authenticated) {
            let items = await itemCollection.find().toArray();
            let itemsPicked = new Array(3);
            for(let i = 0; i < 3 && i < items.length; i++) {
                let rand;
                do {
                    rand = parseInt(Math.random() * items.length);
                } while(items[rand] == null);

                itemsPicked[i] = items[rand];
                items[rand] = null;
            }
            res.render('shop', {items: itemsPicked});
        } else {
            res.redirect('/login');
        }
    });

    

    return router;
}

