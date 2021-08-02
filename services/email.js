const nodemailer = require("nodemailer")
const { google } = require("googleapis")
const OAuth2 = google.auth.OAuth2

async function sendMail({ from, to, subject, text, html }) {
  const oauth2Client = new OAuth2(
    process.env.CLIENT_ID, // ClientID
    process.env.CLIENT_SECRET, // Client Secret
    process.env.REDIRECT_URL // Redirect URL
  )

  oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN,
  })

  const accessToken = oauth2Client.getAccessToken()

  let transporter = nodemailer.createTransport({
    //SMTP
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: from,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
      accessToken: accessToken,
    },
  })

  const mailOptions = {
    from: `FileWare <${from}>`,
    to: to,
    subject: subject,
    text: text,
    html: html,
  }
  transporter.sendMail(mailOptions, (error, response) => {
    if (error) {
      console.log(error)
    } else {
      console.log(response)
    }
    transporter.close()
  })
  // console.log(info)
}

module.exports = sendMail
