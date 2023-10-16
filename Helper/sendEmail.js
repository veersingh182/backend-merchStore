const nodemailer = require('nodemailer')
require("dotenv").config();

const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;


const sendGmail = async (email, subject, body) => {
    try {
        const myOAuth2Client = new OAuth2(
            process.env.GMAIL_CLIENT_ID,
            process.env.GMAIL_CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        )

        myOAuth2Client.setCredentials({
            refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });
        const myAccessToken = myOAuth2Client.getAccessToken();
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                type: "OAuth2",
                user: process.env.GMAIL,
                clientId: process.env.GMAIL_CLIENT_ID,
                clientSecret: process.env.GMAIL_CLIENT_SECRET,
                refreshToken: process.env.GMAIL_REFRESH_TOKEN,
                accessToken: myAccessToken
            }
        });

        let from = `Feedback form <${process.env.GMAIL}>`
        var mailOptions = {
            from: from,
            to: email,
            subject: subject,
            html: body
        };

        result = await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    resolve({ status: 500, err: error })
                } else {
                    resolve({ status: 200 })
                }
            });
        })
        return result
    }
    catch (error) {
        return { status: 500, err: error }
    }
}

module.exports = sendGmail;