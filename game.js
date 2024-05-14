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
    var coins = Math.floor(Math.random() * 10) + 1;
    req.session.gameSession.playerCoins += coins;
}



module.exports = {
    damageCalculator,
    coinDistribution
};