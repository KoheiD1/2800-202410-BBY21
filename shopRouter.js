const express = require('express');
const router = express.Router();
const ejs = require('ejs');

router.use(express.urlencoded({extended: false}));
const { damageCalculator, coinDistribution, purchaseItem } = require('./game');



module.exports = function(itemCollection, userCollection) {
    router.get('/shop', async (req, res) => {
        res.locals.userProfilePic = req.session.profile_pic;
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

    router.get('/purchase',  async (req, res) => {
        let info = req.query.info;
        // res.redirect('/');
        let name = req.session.username;
        let result = await userCollection.find({username: name}).toArray();
        console.log(result[0].itemList.length);
        let item = {type : info.substring(0, info.indexOf(',')),
                    effects : []};
        let effect = true;
        let effectName = '';

        for(let i = info.indexOf(',') + 1; i != 0;) {
            if(effect == true) {
                effectName = info.substring(i, info.indexOf(',', i));
                item.effects[item.effects.length] = effectName;
                i = info.indexOf(',', i) + 1;
                effect = false;
            } else {
                let num;
                if(info.indexOf(',', i) == -1) {
                    num = info.substring(i);
                } else {
                    num = info.substring(i, info.indexOf(',', i));
                }
                item[effectName] = num;
                i = info.indexOf(',', i) + 1;
                effect = true;
            }
        }

        result[0].itemList[result[0].itemList.length] = item;
        if(!purchaseItem(req, item)){
           
        }

        res.redirect('/shop');
    });

    return router;
}

