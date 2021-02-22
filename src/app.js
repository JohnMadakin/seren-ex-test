const express = require('express');
const cron = require('node-cron');
const morgan = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const routes = require('./routes/index');
const controller = require('./controllers/match_controller');

const app = express();

var transport = nodemailer.createTransport({
  host: 'smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.SMTP_MAILER_USERNAME,
    pass: process.env.SMTP_MAILER_PASSWORD,
  },
});

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// cron.schedule("*/30 * * * *", function() {
//     controller.handleBulkMatch()
// });

app.get('/', (req, res, next) => {
  // console.log(res, 'res==========')
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Welcome to Seren!, you should not be here though');
});

app.post('/mail/user', (req, res) => {
  const message = {
    from: 'seren@test.com',
    to: req.userEmail,
    subject: req.subject,
    html:
      '<h1>Have the most fun you can in a car!</h1><p>Get your <b>Tesla</b> today!</p>',
    // attachments: [
    //     { // Use a URL as an attachment
    //         filename: 'your-testla.png',
    //         path: 'https://media.gettyimages.com/photos/view-of-tesla-model-s-in-barcelona-spain-on-september-10-2018-picture-id1032050330?s=2048x2048'
    //     }
    // ]
  };
  // console.log('got in here===============')
  transport.sendMail(message, function (err, info) {
    if (err) {
      console.error(err);
    } else {
      console.log(info);
    }
  });
});

app.get('/health', (req, res, next) => {
  res.status(200).json({
    status: 'UP',
  });
});

app.use('/api/seren/v1', routes);

module.exports = app;
