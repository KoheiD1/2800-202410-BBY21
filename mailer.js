require('dotenv').config();

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const OAuth2_Client = new OAuth2(
  process.env.OAUTH_CLIENT_ID, 
  process.env.OAUTH_CLIENT_SECRET);

OAuth2_Client.setCredentials({ refresh_token: process.env.OAUTH_REFRESH_TOKEN });

async function sendMail(to, subject, text, html) {
  try {
      const accessToken = await OAuth2_Client.getAccessToken();
      
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              type: 'OAuth2',
              user: process.env.OAUTH_EMAIL,
              clientId: process.env.OAUTH_CLIENT_ID,
              clientSecret: process.env.OAUTH_CLIENT_SECRET,
              refreshToken: process.env.OAUTH_REFRESH_TOKEN,
              accessToken: accessToken.token
          }
      });

      const mailOptions = {
          from: process.env.OAUTH_EMAIL,
          to: to,
          subject: subject,
          text: text,
          html: html
      };

      const result = await transporter.sendMail(mailOptions);
      return result;
  } catch (error) {
      console.error('Error sending email:', error);
      throw error;
  }
}

module.exports = { sendMail };