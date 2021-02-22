const NodeCache = require('node-cache');
const cache = new NodeCache();


const handleCache = (team_id) =>{
    cache.set('team_id', team_id);
}

const loadCache = () =>{
    return cache.get('team_id');
}

const deleteCache = () =>{
    return cache.del('team_id');
}



module.exports = {
    handleCache, 
    loadCache, 
    deleteCache
};