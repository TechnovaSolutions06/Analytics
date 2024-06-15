const mongoose = require("mongoose")

const questions = mongoose.Schema({
    question: {type: String},
    number: {type: Number},
    options: {type: Array},
    answer: {type:Number},
    rating: {type: Number},
})

const coding = mongoose.Schema({
    question: {type: String},
    number: {type: Number},
    description: {type: String},
    output: [
        { 
            input:[{type:Array}],
            output: {type: String},
            rating: {type: Number},
            description: {type: String}
        }],
    testcase: [
        {
            input: [{type:Array}],
            output:{type: String},
            rating: {type: Number},
            description: {type: String}
        }],
    outputRating: {type: Number},
    testcaseRating: {type: Number}
})

const Schema = mongoose.Schema({
    name:{type: String},
    category: {type: String,required: true},
    time: {type: Number, default:60},
    questions: {
        type: Array,
    },
    show: {type: Boolean, default: false}
})

const Exam = new mongoose.model("sections",Schema);

module.exports = Exam;