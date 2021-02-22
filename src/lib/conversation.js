const { uuid } = require("uuidv4");
const moment = require('moment');
const Redis = require('ioredis');
const cache = new Redis(process.env.REDIS_URL); 

class Conversation{
    constructor(conversation = []) {
        this.conversation = conversation;
        this.id = uuid();
        this.logged = moment();
        this.expired = () => moment().diff(this.logged, 'hours') > 1
    }

    // create question queue
    // set conversation queue to true
    // if conversation is on queue, automate next question;

    startQueue(){
        // set queue to 1
        // return q.index 0
        // this.queuelastIndex 
    };

    next(){
        // 
    }

    addNewQuestion(q, opts = []){
        this.conversation.push({question: q, options: opts, answer: null, index: this.conversation.length});
    };

    answer(ans){
        let lastQ = this.conversation.pop();
        lastQ.answer = ans;
    }

    // [{},{},{}]

    buildIntro(conversation) {
        let convo = conversation ? conversation: this.conversation.pop();
        console.log(convo, 'convo')

    }

    buildConvo (conversation) {
        let convo = conversation ? conversation: this.conversation.pop();
        console.log(convo, 'convo')
        if (!convo.options || !convo.options.length) {
            return {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": convo.question
                        }
                    }
                ]
            }
        }
        
        return {
            "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": convo.question
                        }
                    },
                    ...convo.options.map(item => {
                        return item
                    })
                ]
        }
    };

    async updateConversation(context) {
        const userId = context._activity.channelData.user;
        const conversationId = context._activity.conversation.id;

        await cache.set(`CONVO_${userId}_${conversationId}`, JSON.stringify(this.conversation))
    }
    
}

module.exports = Conversation;