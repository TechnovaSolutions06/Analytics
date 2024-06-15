const mongoose = require("mongoose")

const schema = {
    username: {type: String},
    eventID: {type: Number},
    title: {type: String},
    college: {type: String},
    department: {type: String},
    year: {type: Number},
    semester: {type: Number},
    section: {type: String},
    eventlink: {type: String},
    date: {type: Date},
    image: {type: String},
}

const Event = new mongoose.model("events",schema);

module.exports = Event;