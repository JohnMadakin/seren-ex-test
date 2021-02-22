const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);
const { WebClient } = require('@slack/web-api');
const { availabilityCheck } = require('./questions');
const Team = require('../models/team.model');
const User = require('../models/user.model');

const sendSMS = async (teamId, userId) => {
  const team = await Team.findOne({slack_team_id: teamId})
  const user = await User.findOne({user_id: userId})
  const phoneNumber = user.preferences ? user.preferences.get('phone') : null

  if (phoneNumber) {
    telnyx.messages.create(
      {
        'from': process.env.TELNYX_PHONE_NUMBER, // Your Telnyx number
        'to': phoneNumber,
        'text': `${availabilityCheck({}).initial_message[0].q} Open ${team.slack_team_name}.slack.com to respond`,
        'messaging_profile_id': process.env.TELNYX_PROFILE_ID
      },
        function(err, response) {
          console.log(response, 'sms response');
          console.log(err, 'sms err');
        }
    );
  }
}

const getUserInfo = async (userId, team) => {
  const web = new WebClient(team.access_token);
  const userInfo = await web.users.info({user: userId, include_locale: true})
  return userInfo
}


module.exports = {sendSMS}