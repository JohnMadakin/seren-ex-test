const Team = require('../models/team.model')
const PromisePool = require('@supercharge/promise-pool');
const { runBulkMatching } = require('../services/seren');


/**
 * Called By the Cron JOB to handle bulk matching.
 * TO DO: A way for a team to decide if they want the cron job to run and when
 */
const handleBulkMatch = async ()=>{
    const teams = await Team.find({})
  
    await PromisePool
    .withConcurrency(3)
    .for(teams)
    .process(async data => {
      try {
        const team = data
        runBulkMatching(team.slack_team_id)
      } catch (err) {
        console.log(err, `error running bulk match for ${team}`)
      }
    })

};

module.exports = {handleBulkMatch}
