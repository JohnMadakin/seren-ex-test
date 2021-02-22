const { adapter,  } = require('../services/bot');
const { WebClient } = require('@slack/web-api');
const Team = require('../models/team.model');
const User = require('../models/user.model');
const { handleCache, deleteCache } = require('../services/cacheService');
const { handleUserRequests } = require('../services/seren');
const {handleMatch} = require('./match_controller')
const {getTokens} = require('../lib/google')

var url = require('url');


/**
 * This is called when the Slack App is installed in a Slack Team
 * @param {*} req
 * @param {*} res
 */
const handleCallback = async (req, res) => {
    try {
        const results = await adapter.validateOauthCode(req.query.code);

        let slackTeamId = results.team.id; // results.team.id in oauth v2
        let slackTeamBotToken = results.access_token; // results.access_token in oauth v2
        let slackTeamBotUserId = results.bot_user_id;
        let appChannel
        let team;
        team = await Team.findOne({ slack_team_id: slackTeamId });

        const web = new WebClient(slackTeamBotToken);
        const randomNumber = Math.floor(Math.random() * (1000 - 0) + 0)

        appChannel = (team && team.channel) ? team.channel : await web.conversations.create({name: `seren-pub-${randomNumber}`})

        team = await Team.findOne({ slack_team_id: slackTeamId });

        if (!team) {
            team = await Team.create({
                slack_team_id: slackTeamId,
                slack_team_name: results.team.name,
                access_token: slackTeamBotToken,
                bot_user_id: slackTeamBotUserId,
                ...(appChannel && appChannel.channel && {app_channel: appChannel.channel.id}),
                slack_authed_user_id: results.authed_user.id,
            });
        } else {
            await Team.updateOne({slack_team_id: slackTeamId},{
                slack_team_id: slackTeamId,
                slack_team_name: results.team.name,
                access_token: slackTeamBotToken,
                bot_user_id: slackTeamBotUserId,
                ...(appChannel && appChannel.channel && {app_channel: appChannel.channel.id}),
                slack_authed_user_id: results.authed_user.id
            });
        }
        const userId = results.authed_user.id
        web.chat.postMessage({text: `Hi <@${userId}>. Thanks for installing Seren`, channel: userId})
        return res.send('Success! Bot installed.');

    } catch (err) {
        console.error('OAUTH ERROR:', err);
        // customize your post-install failure page
        return res.status(401).send(err.message);
    }

};

const getAddToSlackButton = (req, res) => {
    return res.render('add_to_slack.pug');
};


/**
 * Completes the google authentication process, retrieves the refresh_token and saves it for the user
 * @param {*} req
 * @param {*} res
 */
const authenticateGoogle = async (req, res) => {
    try {
        const qs = new url.URL(req.url, process.env.API_HOST).searchParams;

        const userId = JSON.parse(qs.get('state')).userId
        const teamId = JSON.parse(qs.get('state')).teamId


        const user = await User.findOne({user_id: userId})
        const team = await Team.findOne({team_id: teamId})
        const tokens = await getTokens(qs.get('code'))
        if (tokens.refresh_token) {
            console.log(user, 'after getting token')
            user ?
            await User.updateOne({user_id: userId}, {team_id: teamId, google_refresh_token: tokens.refresh_token}) :
            await User.create({user_id: userId, team_id: teamId, google_refresh_token: tokens.refresh_token})
        } else {
            res.status(200).send('You have already connected your app to Seren')
        }
        res.render('connect_to_google.pug');
    } catch(err) {
        console.log(err, 'what is error')
        return res.status(401).send(err.message);
    }
}

/**
 * Handles requests comming from Slack
 * @param {*} req
 * @param {*} res
 */
const handleSlackMessages = async (req, res) => {
    const payload = req.body.payload ? JSON.parse(req.body.payload): req.body;

    try {
        const response = await handleUserRequests(payload);

        return res.status(200).send(response)

    } catch (error) {
        console.log("Error processing slack messages", error)
    }

};


module.exports = { handleCallback, getAddToSlackButton, handleSlackMessages, authenticateGoogle};