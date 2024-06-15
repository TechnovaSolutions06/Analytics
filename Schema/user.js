const mongoose = require("mongoose");

const userschema = mongoose.Schema({
        name: {type: String},
        username: {type: String},
        password: {type: String},
	image: {type: String},
        role: {type: String},
        rollno: {type: String},
        register: {type:String},
        college: {type: Object},
        department: {type: Object},
        email: {type: String},
    })


const User = new mongoose.model("users", userschema);

module.exports = User;
