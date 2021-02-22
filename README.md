## Seren bot

Current available commands:
1. /seren help
2. /seren hi or @seren to initiate a conversation with Seren
3. /seren cm or /seren create meeting @tolu @chilas to create a meeting with both users
4. /seren match to trigger a match with random users in your workspace based on your previously defined preferences
5. /seren archive - only available to admin, right now you have to update this directly in the database to true to make a user an admin, should implement a way to do this from slack or from a UI
6. /seren sms - creates phone number so user can receive SMS notifications
7. /seren update - update your seren profile preferences



###  Dev env Setup
- Install Mongo and have it running
- Install Redis and have it running
- Create a .env file with all the keys in `.env.example` file
- Create a mongo DB and update the `.env` file with that
- Start your server by running `yarn start:dev`
- Install ngrok and create a tunnel to port 3000 or if you change the port, the app is running on, tunnel to that port
- Use the ngrok url to update all the places in the `.env.example` that says use base server url (note you have to update it every time the tunnel expires)
- Create an example Slack app following this tutorial https://api.slack.com/tutorials and use the above copied ngrok url as your base server url
- Update the `add_to_slack.pug` file with the correct install link created by the Slack app
- Install your app according to the above tutorial or visit `<ngrok url>/api/seren/v1/add` and install to any slack team
- Start interacting with Seren once the install succeeds

#### Relevant Files
- `lib/questions`
  - Has almost all the custom slack message responses for different commands and flows
- `services/match`
  - Handles finding matches, users availability and grouping based on user preferences
- `services/seren`
  - Determines how to handle direct messages with the App, Slash commands and dialog actions
