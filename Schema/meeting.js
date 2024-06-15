const mongoose =require("mongoose");

const schema = new mongoose.Schema({
    title: {type: String},
    date: {type: Date},
    timing: {type: Date},
    link: {type: String},
    college: {type: String},
    department: {type: String},
})

const Meet = mongoose.model("meetings", schema);

module.exports = Meet;