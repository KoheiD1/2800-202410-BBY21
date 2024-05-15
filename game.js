//Calculates the damage taken by the player and enemy
function damageCalculator(choice, req) {
    var enemyHealth = req.session.battleSession.enemyHealth;
    var enemyDamage = req.session.battleSession.enemyDMG;
    var playerHealth = req.session.gameSession.playerHealth;
    var playerDamage = req.session.gameSession.playerDMG;
    
    if (choice) {
        enemyHealth -= playerDamage;
        req.session.battleSession.enemyHealth = enemyHealth;
    } else {
        playerHealth -= enemyDamage;
        req.session.gameSession.playerHealth = playerHealth;
    }
}

function coinDistribution(req) {
    var coins = 10;
    req.session.gameSession.playerCoins += coins;
}

// function damageMultiplier(req) {
//     var playerDamage = req.session.gameSession.playerDMG;
//     var playerInventory = req.session.gameSession.playerInventory;
    
//     playerInventory.forEach(item => {
//         item.
//     });

// }

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
    purchaseItem
};