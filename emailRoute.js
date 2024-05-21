const express = require('express');
const router = express.Router();
const { sendMail } = require('./mailer');
const { database } = require('./databaseConnection');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const saltRounds = 12;

function generateResetToken() {
    // Generate a random token using crypto module
    const token = crypto.randomBytes(20).toString('hex');
    return token;
}

module.exports = { generateResetToken };

const userCollection = database.db(process.env.MONGODB_DATABASE).collection('users');

// Route to handle forgot password
router.post('/forgotPassword', async (req, res) => {
    const email = req.body.email;

    try {
        const user = await userCollection.findOne({ email: email });

        if (user) {
            const resetToken = generateResetToken();
            console.log('token in forgotPassword:' + resetToken);
            const resetLink = `http://localhost:3000/resetPassword?token=${resetToken}`;
            
            // Save the reset token and expiry in the user document in the database
            await userCollection.updateOne({ email: email }, { $set: { resetToken: resetToken, resetTokenExpiry: new Date(Date.now() + 3600000) } });

            // Send the reset password email
            await sendMail(email, 'Reset Password', `Click the link to reset your password: ${resetLink}`);
            
            res.send('Password reset link sent to your email');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

// Route to handle password reset
router.post('/resetPassword', async (req, res) => {
    const { token, newPassword } = req.body;
    console.log('token in resetPassword:' + token);
    try {
        // Find the user by reset token and ensure the token is not expired
        const user = await userCollection.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
        console.log(user);

        if (user) {
            // Hash the new password and update the user document in the database
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            await userCollection.updateOne({ _id: user._id }, { $set: { password: hashedPassword }, $unset: { resetToken: "", resetTokenExpiry: "" } });
            
            res.send('Password reset successful');
        } else {
            res.status(400).send('Invalid or expired reset token');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
