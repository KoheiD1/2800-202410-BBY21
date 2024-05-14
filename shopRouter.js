const express = require('express');
const router = express.Router();
const ejs = require('ejs');

router.use(express.urlencoded({extended: false}));
const {purchaseItem } = require('./game');



module.exports = function(itemCollection, userCollection) {
    router.get('/shop', async (req, res) => {
        res.locals.userProfilePic = req.session.profile_pic;
        res.locals.playerCoins = req.session.gameSession ? req.session.gameSession.playerCoins : 0;
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

    router.get("/itemAdder", (req, res) => {
        if(req.query.pwd == process.env.ITEM_PASSWORD) {
            res.render("itemAdder", {msg: req.query.msg});
        } else {
            res.send("this page does not exist");
        }
    });

    router.post("/addItem", async (req, res) => {
        let item = {};
        item.type = req.body.itemName;

        if(item.type == "") {
            res.redirect("/itemAdder?msg=Name Needed");
        }

        item.effects = [];

        for(let i = 1; i < 4; i++) {
            let effectName = 'effect' + i;
            let name = req.body[effectName];
            if(name != "") {
                item.effects[item.effects.length] = name;
                item[item.effects[item.effects.length - 1]] = new Array(1);
                item[item.effects[item.effects.length - 1]][0] = req.body[effectName + '-1'];
                let effectMax = req.body[effectName + '-2'];
                if(effectMax != "") {
                    item[item.effects[item.effects.length - 1]][1] = req.body[effectName + '-2'];
                }
            } else {
                if(i == 1) {
                    res.redirect("/itemAdder?msg=Effect Needed");
                }
                break;
            }
        }

        item.price = req.body.price;

        if(item.price == "") {
            res.redirect("/itemAdder?msg=Price Needed");
        }

        await itemCollection.insertOne(item);

        let string = "/itemAdder?msg=Item Added" + item;
        res.redirect(string);
    });

    return router;
}

