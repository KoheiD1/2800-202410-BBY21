const { cloudcontrolspartner } = require("googleapis/build/src/apis/cloudcontrolspartner");
const { func } = require("joi");

//Calculates the damage taken by the player and enemy
function damageCalculator(choice, req) {
    var enemyHealth = req.session.battleSession.enemyHealth;
    var enemyDamage = req.session.battleSession.enemyDMG;
    var answerStreak = req.session.battleSession.answerStreak;
    var playerHealth = req.session.gameSession.playerHealth;
    var playerDamage = req.session.gameSession.playerDMG;
    var playerInventory = req.session.gameSession.playerInventory;
    var speedStatus = 0;

    playerInventory.forEach(item => {
        for(let i = 0; i < item.effects.length; i++) {
            if(item.effects[i] == "speed") {
                speedStatus += parseInt(item[item.effects[i]]);
            }
            
        }
    });

    if(speedStatus < 0){
        speedStatus = 0;
    }

    if (choice) {
        enemyHealth -= Math.round(playerDamage * (1 + (speedStatus/100 * answerStreak)));
        req.session.battleSession.enemyHealth = enemyHealth;
    } else {
        playerHealth -= enemyDamage;
        req.session.gameSession.playerHealth = playerHealth;
    }
}

function calculateHealth(req) {
    var playerInventory = req.session.gameSession.playerInventory;
    var healthStatus = 0;

    playerInventory.forEach(item => {
        for(let i = 0; i < item.effects.length; i++) {
            if(item.effects[i] == "health") {
                healthStatus +=  parseInt(item[item.effects[i]]);
            }
        }
    });

   return healthStatus;
}

function enemeyScaling(req) {
    playerLevel = req.session.gameSession.playerLevel;
    if(playerLevel == 0) {
        return 1;
    }
    multFactor = playerLevel * 1.5;
    return multFactor;
}

function regenCalculator(req) {
    var playerInventory = req.session.gameSession.playerInventory;
    var regenStatus = 0;

    playerInventory.forEach(item => {
        for(let i = 0; i < item.effects.length; i++) {
            if(item.effects[i] == "cooling") {
                regenStatus +=  parseInt(item[item.effects[i]]);
            }
        }
    });

   return regenStatus;
}

function itemDamage(req) {
    var playerInventory = req.session.gameSession.playerInventory;
    var damageStatus = 0;

    playerInventory.forEach(item => {
        for(let i = 0; i < item.effects.length; i++) {
            if(item.effects[i] == "damage") {
                damageStatus +=  parseInt(item[item.effects[i]]);
            }
        }
    });

   return damageStatus;
}


    var coinsReceived = false;
function coinDistribution(difficulty) {
    if(!coinsReceived){
        switch(difficulty) {
            case "triangle":
                return 500;
            case "square":
                return 10;
            case "pentagon":
                return 25;
            case "hexagon":
               return 50;
        }
    }   
   coinsReceived = true;
}

function resetCoinsReceived() {
    coinsReceived = false;
}

// function damageMultiplier(req) {
//     var playerDamage = req.session.gameSession.playerDMG;
//     var playerInventory = req.session.gameSession.playerInventory;
    
//     playerInventory.forEach(item => {
//         item.
//     });

// }

function chooseEnemy(req, difficulty, enemies) {
    fightablteEnemies = [];
    
    enemies.forEach(enemy => {
        if(enemy.difficulty == difficulty){
            fightablteEnemies.push(enemy);
        }
    });

    var rand = Math.floor(Math.random() * fightablteEnemies.length);
    return fightablteEnemies[rand];
};


function purchaseItem(req, item) {
    console.log("item price: " + item.price);
    if(purchasable(req.session.gameSession.playerCoins, item.price)){
        req.session.gameSession.playerCoins -= item.price;
        req.session.gameSession.playerInventory.push(item);
    }else{
        return false;
    }
}

function purchasable(coins, price){
    if(coins >= price){
        return true;
    }else{
        return false;
    }
}

function additionalHealth(req){
    var playerHealth = 100;
    var additionalHealth = calculateHealth(req);

    if(playerHealth + additionalHealth == req.session.gameSession.maxPlayerHealth){
        return;
    }else{
        req.session.gameSession.maxPlayerHealth = playerHealth + additionalHealth;
        req.session.gameSession.playerHealth += additionalHealth;
    }
}

function additionalDMG(req){
    var playerDMG = 25;
    var additionalDMG = itemDamage(req);

    if(playerDMG + additionalDMG == req.session.gameSession.playerDMG){
        return;
    }else{
        req.session.gameSession.playerDMG = playerDMG + additionalDMG;
    }
}





module.exports = {
    damageCalculator,
    coinDistribution,
    purchaseItem,
    chooseEnemy,
    resetCoinsReceived,
    regenCalculator,
    enemeyScaling,
    additionalHealth,
    additionalDMG
};