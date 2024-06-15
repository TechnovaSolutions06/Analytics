const mongoose = require('mongoose');

const ProgramTaskSchema = mongoose.Schema({
    title: {type: String},
    description: {type: String},
    number: {type: Number},
    rating: {type: Number},
    inputDescription: {type: String},
    outputDescription: {type:String},
    io: {type: Array},
    testcase: {type: Array},
    testcaseDescription: {type: String},
    submission: {type: Number},
})

const Program = new mongoose.model("trainings",ProgramTaskSchema);

module.exports = Program;
