const mongoose = require("mongoose");

const stellarSchema = new mongoose.Schema({
    username: { type: String, default: '' },
    fleetsString: { type: String, default: '' },
    userMaxDuration: { type: Number, default: 0 },
    fleets: [{
        fleetType: { type: String, default: 'Light' },
        travelDuration: { type: Number, default: 0 },
        travelRemainingTime: { type: Number, default: 0 },
        remainingTime: { type: Number, default: 0 }
    }]
});

module.exports = mongoose.model("StellarModel", stellarSchema);