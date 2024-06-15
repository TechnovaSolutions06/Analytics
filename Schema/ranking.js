const mongoose = require("mongoose")

const Schema = mongoose.Schema({
    studentid: {type: Object},
    studentname: {type: String},
    department: {type: Object},
    departmentName: {type: String},
    college: {type: Object},
    collegeName: {type: String},
    obtain: {type: Number},
    overall: {type: Number},
    average: {type: Number},
    rank: {type: String}
})

const Rank = mongoose.model("Rank",Schema)

module.exports = Rank;