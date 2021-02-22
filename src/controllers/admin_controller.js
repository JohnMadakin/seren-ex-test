const MatchService = require('../services/match')
const Team = require('../models/team.model')
const PromisePool = require('@supercharge/promise-pool');
const { runBulkArchiving } = require('../services/admin');

const bulkArchive = async ()=>{
    const teams = await Team.find({})

    await PromisePool
    .withConcurrency(3)
    .for(teams)
    .process(async data => {
      try {
        const team = data
        runBulkArchiving(team.slack_team_id)
      } catch (err) {
        console.log(err, `error running bulk archiving for ${team}`)
      }
    })
    
};

module.exports = {bulkArchive}