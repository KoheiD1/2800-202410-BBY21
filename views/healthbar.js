console.log("Healthbar.js is linked and executing.");
var fills = document.querySelectorAll(".healthbar_fill");

var healthLeft = 100;
var healthRight = 100;
var maxHp = 100;

function renderHealth() {
   
    var percentLeft = healthLeft / maxHp * 100;
    var percentRight = healthRight / maxHp * 100;
    var leftFill = document.getElementById("healthbar-left").querySelector(".healthbar_fill");
    var rightFill = document.getElementById("healthbar-right").querySelector(".healthbar_fill");
    leftFill.style.width = percentLeft + "%";
    rightFill.style.width = percentRight + "%";
   
   //Update color
   document.documentElement.style.setProperty('--bar-fill', '#57e705');
   document.documentElement.style.setProperty('--bar-top',  '#6aff03');
   
   if (percent <= 50) { //yellows
      document.documentElement.style.setProperty('--bar-fill', '#d6ed20');
      document.documentElement.style.setProperty('--bar-top',  '#d8ff48');   
   }
   if (percent <= 25) { //reds
      document.documentElement.style.setProperty('--bar-fill', '#ec290a');
      document.documentElement.style.setProperty('--bar-top',  '#ff3818');
   }

   fills.forEach(fill => {
      fill.style.width = percent+"%";
   })   
}

function updateHealth(change) {
  if (change === 0) { // Reset health bars to maximum value
    healthLeft = maxHp;
    healthRight = maxHp;
  } else {
    if (data.result) { // Right health bar takes damage
      healthRight += change;
    } else {
      healthLeft += change;
    }
    healthLeft = healthLeft > maxHp ? maxHp : healthLeft;
    healthRight = healthRight > maxHp ? maxHp : healthRight;
    healthLeft = healthLeft < 0 ? 0 : healthLeft;
    healthRight = healthRight < 0 ? 0 : healthRight;
  }
  renderHealth();
}
//init
updateHealth(0)

