const userNameParser = (text, regex=/\@[^|]+/gm) => {
  let users = (text.match(regex) || []).map(e => e.replace('@', ''));
  console.log(users, 'users')
  return users
}

const userNameParserWithDirectMention = text => {
  return userNameParser(text, /\@[^>]+/gm)
}


module.exports = {userNameParser, userNameParserWithDirectMention}