const mongoose = require("mongoose")

const schema = mongoose.Schema({
    user_id: {type: String},
    ipaddress: {type: String},
    userAgent: {type: String},
    date: {type: String},
    expiryAt: {type: Date, expires:0 }
})

const Activity = mongoose.model("activity", schema)

module.exports = Activity;
