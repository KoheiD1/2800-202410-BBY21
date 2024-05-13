function damageCalculator(choice) {
    var enemyHealth = req.session.battleSession.enemyHealth;
    var enemyDamage = req.session.battleSession.enemyDMG;
    var playerHealth = req.session.gameSession.playerHealth;
    var playerDamage = req.session.gameSession.playerDamage;
    if (choice) {
        enemyHealth -= playerDamage;
    } else {
        playerHealth -= enemyDamage;
    }
}