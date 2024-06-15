const mongoose = require('mongoose');

const ProgramTaskSchema = mongoose.Schema({
    examID: {type: Number},
    question: {type: String},
    number: {type: Number},
    rating: {type: Number},
    answer: {type: String},
    options: {type: Array},
    submission: {type: Number},
})

const MCQ = new mongoose.model("mcq",ProgramTaskSchema);

module.exports = MCQ;