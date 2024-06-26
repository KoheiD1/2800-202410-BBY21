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
            const resetLink = `http://codecrypt.onrender.com/resetPassword?token=${resetToken}`;

            // Save the reset token and expiry in the user document in the database
            await userCollection.updateOne({ email: email }, { $set: { resetToken: resetToken, resetTokenExpiry: new Date(Date.now() + 3600000) } });

            // Send the reset password email
            await sendMail(email, 'Reset Password', `Click the link to reset your password: ${resetLink}`);

            res.send(`
                <html>
                <head>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        body {
                            background-image: url('/indexBG.png');
                            background-size: cover;
                            background-position: center;
                        }
                    </style>
                </head>
                <body class="bg-gray-100 flex items-center justify-center h-screen">
                    <div class="text-center p-6">
                        <div class="bg-green-100 text-green-700 p-8 rounded-lg shadow-lg max-w-md mx-auto text-xl sm:text-xl lg:text-2xl">
                            <p>Password reset link sent to your email</p>
                            <a href="https://${email.split('@')[1]}" class="mt-5 inline-block bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-700 transition duration-300 ease-in-out text-xl sm:text-xl">
                                Go to ${email.split('@')[1]}
                            </a>
                        </div>
                    </div>
                </body>
                </html>
            `);
        } else {
            res.send(`
                <html>
                <head>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        body {
                            background-image: url('/indexBG.png');
                            background-size: cover;
                            background-position: center;
                        }
                    </style>
                </head>
                <body class="bg-gray-100 flex items-center justify-center h-screen">
                    <div class="text-center p-6">
                        <div class="bg-red-100 text-red-700 p-8 rounded-lg shadow-lg max-w-md mx-auto text-xl sm:text-xl lg:text-2xl">
                            <p>User not found</p>
                            <div class="mt-5 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                                <a href="/forgotPassword" class="bg-yellow-500 text-white py-3 px-6 rounded hover:bg-yellow-700 transition duration-300 ease-in-out text-xl sm:text-xl">
                                    Try Again
                                </a>
                                <a href="/login" class="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-700 transition duration-300 ease-in-out text-xl sm:text-xl">
                                    Back to Login
                                </a>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send(`
            <html>
            <head>
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                <style>
                    body {
                        background: url('/indexBG.png') no-repeat center center fixed;
                        background-size: cover;
                    }
                </style>
            </head>
            <body class="bg-gray-100 flex items-center justify-center h-screen">
                <div class="text-center p-6">
                    <div class="bg-red-100 text-red-700 p-8 rounded-lg shadow-lg max-w-md mx-auto text-xl sm:text-xl lg:text-2xl">
                        Server error
                        <div class="mt-5">
                            <a href="/" class="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 text-xl sm:text-xl">Back to Main Menu</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
    }
});

// Route to handle password reset
router.post('/resetPassword', async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        // Find the user by reset token and ensure the token is not expired
        const user = await userCollection.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });

        if (user) {
            // Hash the new password and update the user document in the database
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            await userCollection.updateOne({ _id: user._id }, { $set: { password: hashedPassword }, $unset: { resetToken: "", resetTokenExpiry: "" } });

            res.send(`
                <html>
                <head>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        body {
                            background-image: url('/indexBG.png');
                            background-size: cover;
                            background-position: center;
                        }
                    </style>
                    <script>
                        let countdown = 5;
                        function updateCountdown() {
                            document.getElementById('countdown').innerText = countdown;
                            if (countdown > 0) {
                                countdown--;
                                setTimeout(updateCountdown, 1000);
                            } else {
                                window.location.href = '/login';
                            }
                        }
                        window.onload = updateCountdown;
                    </script>
                </head>
                <body class="bg-gray-100 flex items-center justify-center h-screen">
                    <div class="text-center p-6">
                        <div class="bg-green-100 text-green-700 p-8 rounded-lg shadow-lg max-w-md mx-auto text-xl sm:text-2xl lg:text-2xl">
                            <p>Password reset successful</p>
                            <p>Redirecting to login in <span id="countdown">5</span> seconds...</p>
                            <a href="/login" class="mt-5 inline-block bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-700 transition duration-300 ease-in-out text-xl sm:text-xl">
                                Login
                            </a>
                        </div>
                    </div>
                </body>
                </html>
            `);
        } else {
            res.status(400).send(`
                <html>
                <head>
                    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                    <style>
                        body {
                            background: url('/indexBG.png') no-repeat center center fixed;
                            background-size: cover;
                        }
                    </style>
                </head>
                <body class="bg-gray-100 flex items-center justify-center h-screen">
                    <div class="text-center p-6">
                        <div class="bg-red-100 text-red-700 p-8 rounded-lg shadow-lg max-w-md mx-auto text-xl sm:text-xl lg:text-2xl">
                            Invalid or expired reset token
                            <div class="mt-5">
                                <a href="/login" class="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 text-xl sm:text-2xl">Back to Login</a>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send(`
            <html>
            <head>
                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                <style>
                    body {
                        background: url('/indexBG.png') no-repeat center center fixed;
                        background-size: cover;
                    }
                </style>
            </head>
            <body class="bg-gray-100 flex items-center justify-center h-screen">
                <div class="text-center p-6">
                    <div class="bg-red-100 text-red-700 p-8 rounded-lg shadow-lg max-w-md mx-auto text-xl sm:text-xl lg:text-2xl">
                        Server error
                        <div class="mt-5">
                            <a href="/" class="bg-blue-500 text-white py-3 px-6 rounded hover:bg-blue-600 text-xl sm:text-xl">Back to Main Menu</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
    }
});

module.exports = router;
