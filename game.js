//Calculates the damage taken by the player and enemy
function damageCalculator(choice, req) {
    var enemyHealth = req.session.battleSession.enemyHealth;
    var enemyDamage = req.session.battleSession.enemyDMG;
    var playerHealth = req.session.gameSession.playerHealth;
    var playerDamage = req.session.gameSession.playerDMG;
    var playerInventory = req.session.gameSession.playerInventory;

    //Calculates the player's damage with the items in the inventory
    playerInventory.forEach(item => {
        for(let i = 0; i < item.effects.length; i++) {
            if(item.effects[i] == "damage") {
                playerDamage +=  parseInt(item[item.effects[i]]);
            }
        }
    });

    console.log("Player Damage: " + playerDamage);
    console.log("Enemy Health: " + enemyDamage);
    
    if (choice) {
        enemyHealth -= playerDamage;
        req.session.battleSession.enemyHealth = enemyHealth;
    } else {
        playerHealth -= enemyDamage;
        req.session.gameSession.playerHealth = playerHealth;
    }
}

    var coinsReceived = false
function coinDistribution(req, difficulty) {
    if(!coinsReceived){
        switch(difficulty) {
            case "triangle":
                req.session.gameSession.playerCoins += 5;
                break;
            case "square":
                req.session.gameSession.playerCoins += 10;
                break;
            case "pentagon":
                req.session.gameSession.playerCoins += 20;
                break;
            case "hexagon":
                req.session.gameSession.playerCoins += 50;
                break;
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
    console.log("Enemy chosen: " + fightablteEnemies[rand].enemyName);
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


module.exports = {
    damageCalculator,
    coinDistribution,
    purchaseItem,
    chooseEnemy,
    resetCoinsReceived
};