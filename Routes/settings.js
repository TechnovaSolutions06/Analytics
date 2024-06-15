const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Student = require("../Schema/user");
const Exam = require("../Schema/events");
const MCQ = require("../Schema/mcq");
const Code = require("../Schema/programming");
const Event = require("../Schema/techevent");
const Department = require("../Schema/department");
const College = require("../Schema/college");

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


exports.image = async(req,res) => {
	const {userID} = req.params;
	const userOld = await Student.findOne({_id:userID});
	if(userOld) {
		return res.json({image:userOld.image});
	}
	else
		return res.json({image:"Not found"})

}

exports.user = async(req,res) => {
    const {userID} = req.params;
    const userOld = await Student.findOne({_id:userID},{password:0})
    if(userOld) {
        const dept = await Department.findOne({_id:userOld.department})
        const college = await College.findOne({_id:userOld.college})
        if(dept && college) {
            return res.json({
                username: userOld.username,
                name: userOld.name,
                email: userOld.email,
                image: userOld.image,
                rollno: userOld.rollno,
                department: dept.department,
                year: dept.year,
                semester: dept.semester,
                section: dept.section,
                college: college.college,
	        departmentID: userOld.department,
	        collegeID: userOld.college,
            })
        }
    }
    else {
        return res.json({user:"Not found"})
    }
}


exports.personal = async(req,res) => {
    const {userID} = req.params;
    const userOld = await Student.findOne({_id:userID})

    var {name, email, rollno, imageData } = req.body;
    const UpdateUser = {
        name: name === undefined || name === null ? userOld.name : name,
        username: userOld.username,
        email: email === undefined || email === null ? userOld.email : email,
        rollno: rollno === undefined || rollno === null ? userOld.rollno : rollno,
        image: imageData === undefined || imageData === null ? userOld.image : imageData
    };

    try {
        await Student.findOneAndUpdate({_id:userID}, UpdateUser, {new: true});
        return res.json({status:"Updated"})
    }
    catch(e) {
        return res.json({status:"Error"})
    }
}

exports.security = async(req,res) => {
    const {userID} = req.params;
    const userOld = await Student.findOne({_id:userID})

    var {oldpassword, password} = req.body;
    if( await bcrypt.compare(oldpassword, userOld.password)) {
        const encPassword = await bcrypt.hash(password, 5);
        try {
            await Student.findOneAndUpdate({_id:userID},{$set: {password: encPassword}}, {new: true})
            return res.json({status:"Updated"})
        }
        catch(e) {
            return res.json({status:"Error"})
        }
    }
    else {
        return res.json({status:"Incorrect password"})
    }
}
