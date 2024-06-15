const mongoose = require("mongoose")

const Schema = mongoose.Schema({
    studentid: {type: Object},
    studentName: {type: String},
    department: {type: String},
    departmentName: {type: String},
    year: {type: Number},
    section: {type: String},
    semester: {type: Number},
    college: {type: String},
    collegeName: {type: String},
    exams: {type:Array},
    scores: {type: Number}
})

const ScoreBoard = new mongoose.model("Scoreboard",Schema);
module.exports = ScoreBoard
