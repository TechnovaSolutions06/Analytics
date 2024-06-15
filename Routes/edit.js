const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Student = require("../Schema/user");
const Exam = require("../Schema/events");
const Event = require("../Schema/techevent");
const Department = require("../Schema/department");
const College = require("../Schema/college");
const Section = require("../Schema/sections")
/*
- Edit Request.
- Edit the allocated exam for the students.
- Identify by the examID. 
*/
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });


exports.exam = async(req,res) => {
    const {examID} = req.params;

    const {title, category, college, department, date, start, end } = req.body;

    const exam = await Exam.findOne({_id:examID});

    const updateExam = {
        title: title ? title : exam.title,
        category: category ? category : exam.category,
        date: date ? date : exam.date,
        start: start ? start : exam.start,
        end: end ? end : exam.end,
        duration: exam.duration,
        sections: exam.sections,
        department: department ? department : exam.department,
        college: college ? college : exam.college,
        overallRating: exam.overallRating
    }

    try {
        await Exam.findOneAndUpdate({_id:examID},updateExam,{new:true});
        return res.json({status:"Updated Exam"});
    }
    catch(e) {
        return res.json({status:"Something went wrong",error:e});
    }
} 

exports.section = async(req,res) => {
    const {sectionID} = req.params;
    const section = await Section.findOne({_id:sectionID});
    let overDuration = 0;
    let overAllPoint = 0;
    const {name,category,hours,minutes,questions} = req.body;
    let hour = hours ? hours : section.hours
    let min = minutes ? minutes : section.minutes
    let duration = (hour*60) + min;
    overDuration += duration;
    // Calculate the score
    if(category==="mcq"){
        for(let question of questions) {
            overAllPoint+= question.rating;
        }
    }
    else {
        for(let question of questions) {
            // Output
            for(let out of question.output) {
                        overAllPoint += out.rating
            }
    
            // Testcase
            for(let test of question.testcase) {
                        overAllPoint += test.rating
            }
        }
    }
    const sect = {
        name: name ? name : section.name,
        category: category ? category : section.category,
        time: duration ? duration : section.duration,
        questions: questions ? questions : section.questions
    }
    try {
        await Section.findOneAndUpdate({_id:sectionID},sect,{new:true});
        return res.json({status:"Updated question of exam"})
    }
    catch(e) {
        return res.json({status:"Something went wrong",error:e});
    }
}

/*
- Edit Request.
- Edit the student of the department on the college.
- Identify by the unique student _id.
*/

exports.userGet = async(req,res) => {
    const {userID} = req.params;
    const userOld = await Student.findOne({_id:userID},{password:0,codeExam:0, completion:0,exams:0, OAScore:0,role:0});
    return res.json({details:userOld});

}

exports.user = async(req,res) => {
    const {userID} = req.params;
    const userOld = await Student.findOne({_id:userID});
    if(!userOld) {
        return res.json({status:"username not exist"})
    }
    var { name,email,password, rollno,imageData } = req.body;
    var uniqueFilename = '';
    if(imageData){
        const imageBuffer = Buffer.from(imageData, 'base64');
        uniqueFilename = `${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
        const imagePath = path.join(__dirname, '..\\uploads', uniqueFilename);
        fs.writeFileSync(imagePath, imageBuffer);
    }
    const encPassword = await bcrypt.hash(password, 5);
    const updateUser = {
        name: name === undefined? userOld.name:name,
        username: userOld.username,
	    image: "uploads/"+uniqueFilename,
        password: password === undefined? userOld.password:  encPassword,
        email: email == undefined ? userOld.email : email,
        rollno: rollno === undefined ? userOld.rollno:rollno,
        college: userOld.college,
        department: userOld.department,
    }

    try {
        await Student.findOneAndUpdate({_id:userID},updateUser,{new:true});
        return res.json({status:"Updated user settings."})
    }
    catch(e) {
        return res.json({status:"Something went wrong",eror:e});
    }
}

/*
- Edit the department of the college.
- Also edit the student detail of the department studied in the department.
*/
exports.department = async(req,res) => {
    const {departmentID} = req.params;

    const {department, year, semester, section } = req.body;
    const dept = await Department.findOne({_id:departmentID}).catch(() => {return res.json({status:"Invalid Department ID"})});
    if(!dept) {
        return res.json({status:"Invalid Department ID"})
    }
    const updateDepartment = {
        department: department? department : dept.department,
        year: year ? year : dept.year,
        semester: semester?semester:dept.semester,
        section: section?section:dept.section,
    }

    try {
        await Department.findOneAndUpdate({_id:departmentID},updateDepartment,{new:true});
        return res.json({status:"Updated department details"});
    }
    catch(e) {
        return res.json({status:"Something went wrong",error:e});
    }
}


/*
- Edit the college.
- Identify by college unique _id.
*/
exports.college = async(req,res) => {
    const {collegeID} = req.params;

    const { college, place } = req.body;
    const clg = await College.findOne({_id:collegeID}).catch(() => {return res.json({status:"Invalid College ID"})});
    if(!clg) {
        return res.json({status:"Invalid Department ID"})
    }
    const updateCollege = {
        college: college?college:clg.college,
        place: place?place:clg.place,
    }

    try {
        await College.findOneAndUpdate({_id:collegeID},updateCollege,{new:true});
        return res.json({status:"Updated college details."});
    }
    catch(e) {
        return res.json({status:"Something went wrong", error:e});
    }
}


/*
- Edit the event.
- Identify the event unique _id.
*/
exports.event = async(req,res) => {
    const {eventID} = req.params;
    const {username,title, college, department, year, semester, section, link, image } = req.body;

    const updateEvent = {
        title:title,
        username: username,
        college: college,
        department: department,
        year: year,
        semester: semester,
        section: section,
        eventlink: link,
        image: image,
    };
    try {
        await Event.findOneAndUpdate({_id:eventID}, updateEvent,{new:true});
        return res.json({status:"Updated event detail"})
    }
    catch(e) {
        return res.json({status:"Something went wrong", error:e});
    }

}
