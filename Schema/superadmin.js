const mongoose = require("mongoose")

const user = mongoose.Schema({
    name: {type: String},
    username: {type: String},
    password: {type: String},
    role: {type: String},
    college: {type: String},
    email: {type: String},
})

const SuperAdmin = new mongoose.model("superadmins", user);

module.exports = SuperAdmin;