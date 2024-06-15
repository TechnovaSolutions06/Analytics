const mongoose = require("mongoose");

const schema = {
    name: { type: String, required: true },
    userid: { type: String, required: true },
    question: { type: String, required: true },
    input: { type: Array, required: true },
    code: { type: String, required: true },
    language: { type: String, required: true },
    isAdminQuestion: { type: Boolean, default: false },
    examID: { type: String, required: true },
    questionID: { type: String, required: true }
};

const Playground = mongoose.model("playground", schema);

module.exports = Playground;
