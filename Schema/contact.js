const mongoose = require("mongoose");

const Schema = new mongoose.Schema({
    firstname: {type:String},
    lastname: {type: String},
    mail: {type: String},
    phone: {type: Number},
    message: {type: String},
});

const Contact = new mongoose.model("contacts",Schema);

module.exports = Contact;