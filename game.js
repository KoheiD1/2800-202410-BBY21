/*
This file contains the game logic. It contains the functions that are used to calculate the damage, health,
and other stats of the player and the enemy. It also contains the functions that are used to purchase items
and choose enemies for the player to fight.

Main Functions: damageCalculator, coinDistribution, purchaseItem, chooseEnemy, regenCalculator, enemeyScaling,
additionalHealth, additionalDMG

Helper Functions: purchasable, itemDamage, calculateHealth
*/



/*
Description: This function calculates the damage that the player
and the enemy will take. It takes in the choice that the
player made and the request object. It then calculates the
damage that the player and the enemy will take based on the
player's choice and the enemy's damage.
*/
function damageCalculator(choice, req) {
    var enemyHealth = req.session.battleSession.enemyHealth;
    var enemyDamage = req.session.battleSession.enemyDMG;
    var answerStreak = req.session.battleSession.answerStreak;
    var playerHealth = req.session.gameSession.playerHealth;
    var playerDamage = req.session.gameSession.playerDMG;
    var playerInventory = req.session.gameSession.playerInventory;
    var speedStatus = 0;

    /*
    Calculate the speed status of the player by adding the speed of all
    the items in the player's inventory
    */
    playerInventory.forEach(item => {
        for (var i = 0; i < item.effects.length; i++) {
            if (item.effects[i] == "speed") {
                speedStatus += parseInt(item[item.effects[i]]);
            }

        }
    });

    // Prevent the speed status from going below 0
    if (speedStatus < 0) {
        speedStatus = 0;
    }

    /*
    Calculate the damage that the player and the enemy will
    take based on the player's choice.
    */
    if (choice) {
        /*
        Speed status is turned into a percentage and
        multiplied by the answer streak then added to 1
        and multiplied by the player's damage.
        */
        enemyHealth -= Math.round(playerDamage *
            (1 + (speedStatus / 100 * answerStreak)));

        req.session.battleSession.enemyHealth = enemyHealth;
    } else {
        playerHealth -= enemyDamage;
        req.session.gameSession.playerHealth = playerHealth;
    }
}

/*
Description: This function chooses an enemy for the player
to fight based on difficulty

Returns: a random enemy
*/
function chooseEnemy(req, difficulty, enemies) {
    fightablteEnemies = [];

    // Filter out the enemies that are fightable based on the difficulty
    enemies.forEach(enemy => {
        if (enemy.difficulty == difficulty) {
            fightablteEnemies.push(enemy);
        }
    });

    // Choose a random enemy from the fightable enemies
    var rand = Math.floor(Math.random() * fightablteEnemies.length);

    return fightablteEnemies[rand];
};

/*
Description: This function scales the enemy's stats based on the player's level

Returns: a multiplier factor used to multiply the enemy's health and damage
*/
function enemeyScaling(req) {
    playerLevel = req.session.gameSession.playerLevel;

    // If the player is level 0, the multiplier factor is 1
    if (playerLevel == 0) {
        return 1;
    }

    // The multiplier factor is 1.5 times the player's level
    multFactor = playerLevel * 1.5;

    return multFactor;
}

/*
Description: This function calculates the regenstatus of the player
based on the items in the player's inventory

Returns: regenStatus(the amount of health the player will regenerate)
*/

function regenCalculator(req) {
    var playerInventory = req.session.gameSession.playerInventory;
    var regenStatus = 0;

    /*
    Calculate the regenstatus of the player by adding the
    cooling of all the items in the player's inventory.
     */
    playerInventory.forEach(item => {
        for (let i = 0; i < item.effects.length; i++) {
            if (item.effects[i] == "cooling") {
                regenStatus += parseInt(item[item.effects[i]]);
            }
        }
    });

    return regenStatus;
}


/*
Description: This function calculates the amount of coins won 
from the diffculty level of the enemy.

returns: the amount of coins the player will win
*/

function coinsWon(difficulty){
    switch (difficulty) {
        case "triangle":
            return 5;
        case "square":
            return 10;
        case "pentagon":
            return 25;
        case "hexagon":
            return 50;
    }
}

/*
Description: This function purchases an item for the player adding it to the
player's inventory and subtracting the price from the player's coins
*/
function purchaseItem(req, item) {
    if (purchasable(req.session.gameSession.playerCoins, item.price)) {
        req.session.gameSession.playerCoins -= item.price;
        req.session.gameSession.playerInventory.push(item);
    } else {
        return false;
    }
}

/*
Description: This helper function checks if the player has enough
coins to purchase an item.

Returns: true if the player has enough coins, false otherwise.
*/

function purchasable(coins, price) {
    if (coins >= price) {
        return true;
    } else {
        return false;
    }
}

/*
Description: This helper function calculates the additional health of the
player based on the items in the player's inventory.

Returns: the additional health of the player.
*/
function calculateHealth(req) {
    var playerInventory = req.session.gameSession.playerInventory;
    var healthStatus = 0;

    /*
    Calculate the health status of the player by adding the health of
    all the items in the player's inventory.
    */
    playerInventory.forEach(item => {
        for (let i = 0; i < item.effects.length; i++) {
            if (item.effects[i] == "health") {
                healthStatus += parseInt(item[item.effects[i]]);
            }
        }
    });

    return healthStatus;
}

/*
Description: This function adds additional health to the player
based on the items in the player's inventory.
*/
function additionalHealth(req) {
    var playerHealth = 100;
    // Calculate the additional health of the player.
    var additionalHealth = calculateHealth(req);

    /*
    If the player's health is already at the max health,
    do not add additional health.
    */
    if (playerHealth + additionalHealth == req.session.gameSession.maxPlayerHealth) {
        return;
    } else {
        /*
        Add the additional health to the player's health
        and the max player health.
        */
        req.session.gameSession.maxPlayerHealth = playerHealth + additionalHealth;
        req.session.gameSession.playerHealth += additionalHealth;
    }
}

/*
Description: This function calculates the additional damage of the player
based on the items in the player's inventory.

Returns: the additional damage of the player.
*/
function itemDamage(req) {
    var playerInventory = req.session.gameSession.playerInventory;
    var damageStatus = 0;

    /*
    Calculate the damage status of the player by adding the
    damage of all the items in the player's inventory.
    */
    playerInventory.forEach(item => {
        for (let i = 0; i < item.effects.length; i++) {
            if (item.effects[i] == "damage") {
                damageStatus += parseInt(item[item.effects[i]]);
            }
        }
    });

    return damageStatus;
}

/*
Description: This function adds additional damage to the player based
on the items in the player's inventory.
*/
function additionalDMG(req) {
    var playerDMG = 25;
    // Calculate the additional damage of the player.
    var additionalDMG = itemDamage(req);

    /*
    If the player has not purchased any items that increase damage,
    do not add additional damage to the player.
    */
    if (playerDMG + additionalDMG == req.session.gameSession.playerDMG) {
        return;
    } else {
        req.session.gameSession.playerDMG = playerDMG + additionalDMG;
    }
}

// Export the functions so that they can be used in other files.
module.exports = {
    damageCalculator,
    purchaseItem,
    chooseEnemy,
    regenCalculator,
    enemeyScaling,
    additionalHealth,
    additionalDMG,
    coinsWon
};