const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
    title: {type: String},
    category: {type: String},
    date: {type: Date},
    start: {type: Date},
    end: {type: Date},
    duration: {type: Number},
    sections: {type:Array, required: true},
    department: {type:Array, required: true},
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'college' }, 
    year: {type:Number},
    overallRating: {type: Number},
})

const Event = new mongoose.model("exams",Schema);

module.exports = Event;
