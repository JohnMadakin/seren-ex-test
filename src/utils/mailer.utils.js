const nodemailer = require('nodemailer')

const transport = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.SMTP_MAILER_USERNAME,
    pass: process.env.SMTP_MAILER_PASSWORD
  }
});

const sendEmail = (user, params) => {
  const message = {
        from: 'seren@test.com',
        to: params.userEmail,
        subject: params.subject,
        html: params.body
        // attachments: [
        //     { // Use a URL as an attachment
        //         filename: 'your-testla.png',
        //         path: 'https://media.gettyimages.com/photos/view-of-tesla-model-s-in-barcelona-spain-on-september-10-2018-picture-id1032050330?s=2048x2048'
        //     }
        // ]
    };
    console.log('got in here===============')
    transport.sendMail(message, function(err, info) {
        if (err) {
        console.log(err)
        } else {
        console.log(info);
        }
    });
}

module.exports = sendEmail