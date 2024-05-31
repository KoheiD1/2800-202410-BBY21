# 2800-202410-BBY21
Group BBY21 2800 project
## About Us
Team Name: BBY-21
Team Members: 
- Tom He
- Ryan Jiang
- Kohei Dunnet
- Reece Melnick
- Logan Pederson
## More details to come
CodeCrypt

Our team, BBY-21, is developing a web-based, mobile-first educational application to help teens and high school students that would like to learn programming learn with an engaging gamified experience. 

CodeCrypt utilizes Node.js on the server side and JavaScript, HTML, CSS supplemented with EJS templating and Tailwind CSS for the frontend. Our database is hosted on MongoDB.

How to Install or Run Project:
To develop on our app, you will need Git, NodeJS, and an IDE (like VSCode) of your choice. You will also need an account on MongoDB to create a cluster for the project's database. You may find it useful to use software like Studio3T for managing the database. You will need a working knowledge of HTML, CSS, JavaScript, NodeJS and EJS to get started. For sending emails to users for forgotten passwords, GoogleAPIS for OAuth 2.0 is used. No API keys were used for these as they are secured by other means. 

Install Git first then clone the project. Install NodeJS and run "npm init" and "npm -i" to install the required modules. Create a database on MongoDB and add the required .env variables in a file named .env in the root. Set up OAuth 2.0 https://support.google.com/cloud/answer/6158849?hl=en and add the .env variables. Good luck, and happy coding! See or contribute any encountered bugs to the testing log: https://docs.google.com/spreadsheets/d/1e7veZHE8RBsbzypTFvNjGlyod2_eP-G4dP6_giTq-LQ/edit#gid=0.

How to use:
Sign up and start a game. You will see a page with a map showing the main character at the bottom of the path. You can select any connected path to choose locations that are explained in the legend button on the top right of the map. Work your way towards the final boss on the top of the map by taking down monsters and buying items in the shop to increase your stats. Each battle consists of tackling a series of questions related to coding that will deal damage to the enemy when you get the answer correct or take damage when you get it incorrect. 

Credits:
Thanks to Safia Dorae for the art assets.

Use of AI:
Github Co-Pilot autocomplete was used occasionally while coding to fill in generic code and repeated.
Chat-GPT was used to generate data for the Java-Related coding questions, which are currently hard-coded.
The application itself does not use AI.
Limitations of AI were that it was useful for simple syntax explanations and boilerplate code that we could easily customize, but generating customized code for features was not reliable or worthwhile. It is important to understand the code fully in order to communicate why specific portions of our code was written to team members during integration. Relying on our own knowledge to code and supplementing it with AI was the best choice during this project.

Contact: rjiang18@my.bcit.ca

List of Files:
/:.
|   .env
|   .gitignore
|   about.html
|   databaseConnection.js
|   Directory.txt
|   emailRoute.js
|   findFriendsRoutes.js
|   friendProfileRoutes.js
|   friendsRoutes.js
|   game.js
|   index.js
|   inventoryRouter.js
|   joi-schema.js
|   joi.js
|   mailer.js
|   package-lock.json
|   package.json
|   profileRoutes.js
|   README.md
|   shopRouter.js
|   Tree.txt
|   utils.js
|   
+---.vscode
|       settings.json
|       
+---node_modules
|       .package-lock.json
|     
+---public
|   |   battle_bg.svg
|   |   button_box.svg
|   |   button_box_long.svg
|   |   coin.png
|   |   computer-kid.svg
|   |   defeat.png
|   |   diamond.png
|   |   dirt.svg
|   |   dirtBackground.svg
|   |   favicon.png
|   |   help_Icon.svg
|   |   i.svg
|   |   indexBG.png
|   |   i_orange.svg
|   |   i_red.svg
|   |   joi-client.js
|   |   kid-head.png
|   |   kid.svg
|   |   mainCharSprite.png
|   |   mainIMG.png
|   |   parchment.svg
|   |   pixel-backdrop.png
|   |   red_button_box.svg
|   |   reset.png
|   |   slotsCurrencyIcon.svg
|   |   stat-sign.svg
|   |   trophy.png
|   |   victory.png
|   |   wolf.svg
|   |   
|   +---css
|   |       battleAnimation.css
|   |       capsuleOpening.css
|   |       currentLocation.css
|   |       defaultBG.css
|   |       easterEgg.css
|   |       fonts.css
|   |       gacha.css
|   |       header.css
|   |       healthbar.css
|   |       hoverglow.css
|   |       index.css
|   |       pixelButton.css
|   |       profile.css
|   |       question.css
|   |       shop.css
|   |       tight.css
|   |       victory.css
|   |       
|   +---easterEgg
|   |       capsuleBottom.svg
|   |       capsuleTop.svg
|   |       gatchaBall.svg
|   |       gatchaMachine.svg
|   |       pxArt (12).png
|   |       Rotater.png
|   |       Rotater.svg
|   |       
|   +---mapAssets
|   |       circle_black.svg
|   |       circle_green.svg
|   |       circle_red.svg
|   |       hexagon_black.svg
|   |       hexagon_green.svg
|   |       hexagon_red.svg
|   |       kid_head.png
|   |       left.svg
|   |       left_active.svg
|   |       legend.svg
|   |       legend2.svg
|   |       middle.svg
|   |       middle_active.svg
|   |       pentagon_black.svg
|   |       pentagon_green.svg
|   |       pentagon_red.svg
|   |       right.svg
|   |       right_active.svg
|   |       shop.svg
|   |       shop_green.svg
|   |       shop_red.svg
|   |       square_black.svg
|   |       square_green.svg
|   |       square_red.svg
|   |       triangle_black.svg
|   |       triangle_green.svg
|   |       triangle_red.svg
|   |       
|   +---monsters
|   |       alien_bug.svg
|   |       beetle_fat.svg
|   |       dragon-enemy.png
|   |       dragon.svg
|   |       ghost.svg
|   |       goblin.svg
|   |       golem.svg
|   |       monster_head.svg
|   |       orc.svg
|   |       Python_Monster.svg
|   |       scorpion.svg
|   |       
|   +---profile
|   |       pfp-1.png
|   |       pfp-10.png
|   |       pfp-11.png
|   |       pfp-2.png
|   |       pfp-3.png
|   |       pfp-4.png
|   |       pfp-5.png
|   |       pfp-6.png
|   |       pfp-7.png
|   |       pfp-8.png
|   |       pfp-9.png
|   |       profile-logo.png
|   |       rare-1.png
|   |       rare-2.png
|   |       superrare-1.png
|   |       superrare-2.png
|   |       ultrarare-1.png
|   |       uncommon-1.png
|   |       uncommon-2.png
|   |       uncommon-3.png
|   |       user-add.png
|   |       username-box.png
|   |       
|   +---shop
|   |       backpack.png
|   |       CPU.png
|   |       Doritos.png
|   |       FAN.png
|   |       GPU.png
|   |       Hard Drive.png
|   |       Headset.png
|   |       ram.png
|   |       shelf.png
|   |       wood.png
|   |       
|   \---ttf
|           000webfont.ttf
|           Apple_.ttf
|           StartGame.ttf
|           titlefont.ttf
|           victory.TTF
|           
\---views
    |   404.ejs
    |   achievements.ejs
    |   adminItems.ejs
    |   capsuleopening.ejs
    |   createUser.ejs
    |   defeat.ejs
    |   easteregganimation.ejs
    |   enemy.html
    |   feedback.ejs
    |   findFriends.ejs
    |   forgotPassword.ejs
    |   friendProfile.ejs
    |   friends.ejs
    |   gatchaPage.ejs
    |   healthbar.html
    |   healthbar.js
    |   hero.html
    |   index-post.ejs
    |   index.ejs
    |   inventory.ejs
    |   itemAdder.ejs
    |   login.ejs
    |   map.ejs
    |   premiumShop.ejs
    |   profile.ejs
    |   question.ejs
    |   resetPassword.ejs
    |   shame.ejs
    |   shop.ejs
    |   victory.ejs
    |   
    \---templates
        |   footer.ejs
        |   header.ejs
        |   headerloggedin.ejs
        |   headerloggedinACHIE.ejs
        |   headerloggedinMAP.ejs
        |   headerloggedinPREM.ejs
        |   headerloggedinQUEST.ejs
        |   headerloggedinSHOP.ejs
        |   informationIcon.ejs
        |   inventoryItem.ejs
        |   shopItem.ejs
        |   shopItemBonus.ejs
        |   svgs.ejs
        |   
        \---mapTemplates
                circle.ejs
                connections.ejs
                connector.ejs
                connectRow.ejs
                empty.ejs
                hexagon.ejs
                pentagon.ejs
                row.ejs
                shape.ejs
                shopshape.ejs
                square.ejs
                triangle.ejs