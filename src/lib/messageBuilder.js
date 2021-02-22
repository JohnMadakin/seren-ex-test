const Conversation = require('./conversation');
const { R, Q, availabilityCheck } = require('./questions');

const {userNameParser, userNameParserWithDirectMention} = require('./text_parser');

const buildConvoFromMessage = (messageBlock) => {
    const conversation = new Conversation();
    conversation.addNewQuestion(...Object.values(messageBlock[0]));
    return conversation.buildConvo();
}

const showSetUpMessage = (user) => {
    if (user) {
        return R(user).existing_setup;
    } else {
        return R().new_setup;
    }
}

const parseMessageForUsers = (context, message) => {
    if (context.command) {
        return userNameParser(message)
    } else {
        return userNameParserWithDirectMention(message)
    }
}

const showWelcomeMessage = () => {
    return R().new_setup;
}

module.exports = {parseMessageForUsers, buildConvoFromMessage, showWelcomeMessage, showSetUpMessage}