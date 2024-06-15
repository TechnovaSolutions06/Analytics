const mongoose = require('mongoose')

const schema = {
    name: {type: String},
    username: {type: String},
    password:{type: String},
    role: {type: String},
}

const Admin = mongoose.model("admins",schema);

module.exports = Admin
