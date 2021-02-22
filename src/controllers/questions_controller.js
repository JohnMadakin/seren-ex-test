const axios = require('axios').default;
const PromisePool = require('@supercharge/promise-pool');
const { Answers } = require('../models/answers.model');
const {directMessage} = require('../lib/slackNotification');

const instance = axios.create({
  baseURL: 'https://slack.com/api',
  headers: {
    Authorization: `Bearer ${process.env.BOT_OAUTH}`,
    'Content-type': 'application/json',
  },
});

const startFeedbackConvo = async (users) => {
  try {
    await PromisePool.withConcurrency(5)
      .for(users)
      .process((user) => {
        instance.post('/chat.postMessage', {
          blocks: [
            {
              type: 'section',
              text: {
                type: 'plain_text',
                text:
                  'How happy are you with your recent conversation on Seren?',
                emoji: true,
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  action_id: 'seren-enjoy-convo-1',
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: '1 :white_frowning_face: ',
                    emoji: true,
                  },
                  value: 'very unhappy',
                },
                {
                  action_id: 'seren-enjoy-convo-2',
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: '2 :slightly_frowning_face: ',
                    emoji: true,
                  },
                  value: 'moderately unhappy',
                },
                {
                  action_id: 'seren-enjoy-convo-3',
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: '3 :neutral_face:',
                    emoji: true,
                  },
                  value: 'neutral',
                },
                {
                  action_id: 'seren-enjoy-convo-4',
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: '4 :slightly_smiling_face: ',
                    emoji: true,
                  },
                  value: 'moderately happy',
                },
                {
                  action_id: 'seren-enjoy-convo-5',
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: '5 :smile:',
                    emoji: true,
                  },
                  value: 'very happy',
                },
              ],
            },
          ],
          as_user: true,
          channel: user,
        }).then(res => {
          console.log('22');
          console.log(res.data);
        });
      });

    // res.json({
    //   ok: true,
    //   message: 'sent messages',
    // });

  } catch (error) {
    console.error('QUESTION ERROR: ', error);
  }
};

module.exports = { startFeedbackConvo };
