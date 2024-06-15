const mongoose = require("mongoose");
const Techevent = require("../Schema/techevent")
const path = require("path")
const fs = require("fs")

// Websocket API
exports.dashboard = async () => {
    const event = await Techevent.find({},{_id:0,__v:0,username:0,college:0,department:0,year:0,semester:0,section:0})
    return res.json({event:event});
}

// Event 
exports.evt = async(req,res) => {
    const event = await Techevent.find({},{eventID:0});
    return res.json({event:event});
}

/*
- Listout the events allocated for the department of their students.
*/
exports.event = async(req,res) => {
    const {eventID} = req.params;
    const event = await Techevent.findOne({_id:eventID});
    return res.json({event:event})
}

/*
- Create a new events allocated for the department of their students.
*/
exports.newevent = async(req,res) => {
    const {username,title, college, department, year, semester, section, link, imageData } = req.body;
    var eventID = new Date().getTime();
    const imageBuffer = Buffer.from(imageData, 'base64');
    const uniqueFilename = `${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
    const imagePath = path.join(__dirname, '..\\uploads', uniqueFilename);
    fs.writeFileSync(imagePath, imageBuffer);
    const event = await Techevent({
        title:title,
        username: username,
        college: college,
        department: department,
        year: year,
        semester: semester,
        section: section,
        eventlink: link,
        image: "uploads/"+uniqueFilename,
    });

    event.save()
    .then( (evt) => res.json({event:"New event added"}))
    .catch( (err) => res.json({event:"Not added"}));
}
