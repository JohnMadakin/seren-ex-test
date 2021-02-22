const {google} = require('googleapis');
const plus = google.plus('v1');
const User = require('../models/user.model')


const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URL
);

google.options({auth: oauth2Client});

const scopes=['https://www.googleapis.com/auth/calendar.readonly', 'https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile']

const generateAuth = (userId, teamId) => {
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: JSON.stringify({userId, teamId})
  });
  console.log(authorizeUrl, 'url')
  return authorizeUrl
}

const getTokens = async (code) => {
  const {tokens} = await oauth2Client.getToken(code);
  return tokens
}

const isAvailableOnCalender = async (user) => {
  oauth2Client.setCredentials({refresh_token: user.google_refresh_token})
  console.log('when is called')

  await oauth2Client.on('tokens', async tokens => {
    if (tokens.refresh_token && tokens.refresh_token !== user.google_refresh_token) {
      oauth2Client.setCredentials({refresh_token: tokens.refresh_token})
      await User.updateOne({user_id: user.user_id}, {google_refresh_token: tokens.refresh_token})
    }
  });

  const userEmail = await google.people({version: 'v1', auth: oauth2Client}).people.get({resourceName: 'people/me', personFields: 'emailAddresses'});

  let calendar = google.calendar({
    auth: oauth2Client,
    version: 'v3'
  });
  const email = userEmail.data.emailAddresses[0].value

  if (email) {
    let now = new Date().toISOString()
    const maxDate=new Date()
    let next30mins = maxDate.setMinutes(maxDate.getMinutes() + 30)

    try {
      const result = await calendar.freebusy.query({
        requestBody: {
            timeMin: now,
            timeMax: new Date(next30mins).toISOString(),
            items: [{ id: email }]
        }
      })
      console.log('######################')
      
      const busy = result.data.calendars[email].busy;
      const errors = result.data.calendars[email].errors;
      console.log(email, 'email')
      console.log(busy, 'busy ========')
      console.log(errors, 'errors ========')

      if (errors !== undefined) {
          console.error('Check that this calendar has public free busy visibility');
          return false
      } else {
        return busy.length === 0
      }

    } catch(err) {
      console.error(err, 'there is an error')
      return false
    }
  }
}


module.exports = {generateAuth, getTokens, isAvailableOnCalender}