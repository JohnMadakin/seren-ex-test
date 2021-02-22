const mongoose = require('mongoose');
const appSettingsSchema = new mongoose.Schema({
    client: {
        type: String,
    },
    name: {
        type: String,
    },
    value: {
        type: String
    },
    expires_in: {
        type: String
    },
    created_at: {
        type: String
    },
    updated_at: {
        type: String
    }
});

const AppSettings = mongoose.model('AppSettings', appSettingsSchema);

module.exports = AppSettings;