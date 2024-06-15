const mongoose = require('mongoose');

const ProgramTaskSchema = mongoose.Schema({
    examID: {type: Number},
    title: {type: String},
    description: {type: String},
    number: {type: Number},
    rating: {type: Number},
    inputDescription: {type: String},
    outputDescription: {type:String},
    io: {type: Array},
    testcase: {type: Array},
    submission: {type: Number},
})

const Program = new mongoose.model("CodingQNs",ProgramTaskSchema);

module.exports = Program;