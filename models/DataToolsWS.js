const mongoose = require('mongoose');

const wsSchema = new mongoose.Schema({
    guid: { type: String, default: ''},
    tool: { type: String, default: ''},
    status: { type: String, default: 'processing'},
    data: {type: Array, default: [{
        working: { type: String, default: false},
        jobComplete: { type: String, default: false},
        siteRef: { type: String, default: ''},
        siteRefName: { type: String, default: ''},
        }]
    },
    type: { type: Boolean, default: false},
    created: { type: Date, default: new Date ().toISOString() },
});

module.exports = mongoose.model('DataToolsWS', wsSchema);
