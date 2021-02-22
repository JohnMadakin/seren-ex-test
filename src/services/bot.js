const { SlackAdapter, SlackEventMiddleware,} = require('botbuilder-adapter-slack');
const Team = require('../models/team.model');
const { loadCache } = require('./cacheService');

async function getTokenForTeam() {
    const teamId = loadCache();
    return new Promise((resolve) => {
        setTimeout(async function () {
            const team = await Team.findOne({ slack_team_id: teamId })
            resolve(team.access_token);
        }, 150);
    });
}

async function getBotUserByTeam() {
    const teamId = loadCache();
    console.log("teamId", teamId)
    return new Promise((resolve) => {
        setTimeout(async function () {
            const team = await Team.findOne({ slack_team_id: teamId })
            resolve(team.bot_user_id);
        }, 150);
    });
}

const adapter = new SlackAdapter({
    clientSecret: process.env.CLIENT_SECRET, // oauth client secret
    clientSigningSecret: process.env.SLACK_SIGNING_SECRET,
    clientId: process.env.SLACK_CLIENT_ID, // oauth client id
    scopes: ['bot'], // oauth scopes requested, 'bot' deprecated by Slack in favor of granular permissions
    redirectUri: process.env.REDIRECT_URI, // url to redirect post-login
    oauthVersion: 'v2', // or use v2
    getTokenForTeam: getTokenForTeam,
    getBotUserByTeam: getBotUserByTeam,
    debug: true
});

adapter.use(new SlackEventMiddleware());

adapter.onTurnError = async (context, error)=>{
    console.error(`\n [onTurnError]: ${ error }`);
    context.sendActivity(`Oops. Something went wrong!`);
};

module.exports = { adapter };


