var healthbarLeft = document.getElementById("healthbar-left");
var healthbarRight = document.getElementById("healthbar-right");

var fillsLeft = healthbarLeft.querySelectorAll(".healthbar_fill");
var fillsRight = healthbarRight.querySelectorAll(".healthbar_fill");

var healthLeft = 100;
var healthRight = 100;
var maxHp = 100;

function renderHealth() {
    var percentLeft = healthLeft / maxHp * 100;
    var percentRight = healthRight / maxHp * 100;
    var leftFill = healthbarLeft.querySelector(".healthbar_fill");
    var rightFill = healthbarRight.querySelector(".healthbar_fill");
    leftFill.style.width = percentLeft + "%";
    rightFill.style.width = percentRight + "%";

    // Update color
    document.documentElement.style.setProperty('--bar-fill', '#57e705');
    document.documentElement.style.setProperty('--bar-top',  '#6aff03');

    // Update color for left health bar
    if (percentLeft <= 50) { // Yellows
        document.documentElement.style.setProperty('--bar-fill-left', '#d6ed20');
        document.documentElement.style.setProperty('--bar-top-left',  '#d8ff48');   
    }
    if (percentLeft <= 25) { // Reds
        document.documentElement.style.setProperty('--bar-fill-left', '#ec290a');
        document.documentElement.style.setProperty('--bar-top-left',  '#ff3818');
    }

    // Update color for right health bar
    if (percentRight <= 50) { // Yellows
        document.documentElement.style.setProperty('--bar-fill-right', '#d6ed20');
        document.documentElement.style.setProperty('--bar-top-right',  '#d8ff48');   
    }
    if (percentRight <= 25) { // Reds
        document.documentElement.style.setProperty('--bar-fill-right', '#ec290a');
        document.documentElement.style.setProperty('--bar-top-right',  '#ff3818');
    }

    fillsLeft.forEach(fill => {
        fill.style.width = percentLeft + "%";
    });

    fillsRight.forEach(fill => {
        fill.style.width = percentRight + "%";
    });
}

function updateHealth(change, isCorrect) {
    if (change === 0) { // Reset health bars to maximum value
        healthLeft = maxHp;
        healthRight = maxHp;
    } else {
        if (isCorrect) {
            healthRight -= change;
        } else {
            healthLeft -= change;
        }
        healthLeft = healthLeft > maxHp ? maxHp : healthLeft;
        healthRight = healthRight > maxHp ? maxHp : healthRight;
        healthLeft = healthLeft < 0 ? 0 : healthLeft;
        healthRight = healthRight < 0 ? 0 : healthRight;
    }
    renderHealth();
}

// Init
updateHealth(0);