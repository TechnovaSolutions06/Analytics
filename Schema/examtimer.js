const mongoose = require("mongoose")

const schema = new mongoose.Schema({
	studentid: {type:Object},
	examid: {type:Object},
	sectionid: {type: Object},
	startTime: {type: Date},
	time: {type: Number},
})

const Timer = new mongoose.model("examtimers",schema);

module.exports =Timer;
