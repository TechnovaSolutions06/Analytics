const mongoose = require("mongoose")

const Schema = mongoose.Schema({
    sectionid: {type: mongoose.Schema.Types.ObjectId},
    category: {type: String},
    points: {type: Number},
    overPoint: {type: Number},
    timetaken: {type: Number},
    questions: {type: Array},
    performance: [{
        _id: {type: mongoose.Schema.Types.ObjectId},
        number: {type: Number},
        output: {type: Array},
        testcase: {type: Array},
        choosen: {type:Number},
        correct: {type:Number},
        status: {type: Boolean},
    }]
})

const Score = new mongoose.model("Scores", Schema);

module.exports = Score;