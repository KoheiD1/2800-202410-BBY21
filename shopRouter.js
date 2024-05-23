const express = require('express');
const router = express.Router();
const ejs = require('ejs');

router.use(express.urlencoded({extended: false}));
const {purchaseItem, coinDistribution, resetCoinsReceived} = require('./game');



module.exports = function(itemCollection, userCollection) {
    router.get('/shop', async (req, res) => {
        if(req.session.authenticated) {
            // resetCoinsReceived();
            // coinDistribution(req, "hexagon");
            // console.log(req.session.gameSession.playerCoins);
            // res.locals.playerCoins = req.session.gameSession ? req.session.gameSession.playerCoins : 0;
            if(req.session.shop == null) {
                req.session.shop = {
                    itemsPicked: []
                };
                let items = await itemCollection.find().toArray();
                let itemsPicked = new Array(3);
                for(let i = 0; i < 3 && i < items.length; i++) {
                    let rand;
                    do {
                        rand = parseInt(Math.random() * items.length);
                    } while(items[rand] == null);
                    console.log(items[rand]);
                    req.session.shop.itemsPicked.push({
                        type: items[rand].type,
                        description: items[rand].description,
                        effects: items[rand].effects,
                        price: items[rand].price
                    });
                        for(let j = 0; j < items[rand].effects.length; j++) {
                            if(items[rand][items[rand].effects[j]].length > 1) {
                                let x = parseInt(Math.random() * (parseInt(items[rand][items[rand].effects[j]][1]) - parseInt(items[rand][items[rand].effects[j]][0]))) + parseInt(items[rand][items[rand].effects[j]][0]);
                                req.session.shop.itemsPicked[i][items[rand].effects[j]] = x;
                            } else {
                                req.session.shop.itemsPicked[i][items[rand].effects[j]] = items[rand][items[rand].effects[j]];
                            }
                        }
                    items[rand] = null;
                }
            }

            res.locals.userProfilePic = req.session.profile_pic;
            res.locals.playerCoins = req.session.gameSession ? req.session.gameSession.playerCoins : 0;
            res.locals.gameStarted = req.session.gameSession ? true : false;

            
            res.render('shop', {items: req.session.shop.itemsPicked});
        } else {
            res.redirect('/login');
        }
    });

    router.get('/purchase',  async (req, res) => {
        let info = req.query.info;
        // res.redirect('/');
        console.log(info);
        let name = req.session.username;
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
        item.price = info.substring(info.lastIndexOf(',') + 1);
        console.log(item);
        purchaseItem(req, item);

        res.render("shop");
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
            history.back();
            res.send("Item Name Needed");
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
            history.back();
            res.send("Price Needed");
        }

        await itemCollection.insertOne(item);

        let string = "/itemAdder?msg=Item Added&pwd=" + process.env.ITEM_PASSWORD;
        res.redirect(string);
    });

    router.get("/adminItems", (req, res) => {
        if(req.query.pwd == process.env.ITEM_PASSWORD) {
            itemCollection.find().toArray().then(items => {
                res.render("adminItems", {items: items});
            });
        }
    });

    return router;
}