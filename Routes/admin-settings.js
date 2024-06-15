const bcrypt = require("bcrypt");
const SuperAdmin = require("../Schema/superadmin");
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

exports.user = async(req,res) => {
    const {userID} = req.params;
    const userOld = await SuperAdmin.findOne({_id:userID},{password:0})
    if(userOld) {
        const college = await College.findOne({_id:userOld.college})
        if(dept && college) {
            return res.json({
                username: userOld.username,
                name: userOld.name,
                image: userOld.image,
                college: college.college
            })
        }
    }
    else {
        return res.json({user:"Not found"})
    }
}

exports.personal = async(req,res) => {
    const {userID} = req.params;
    const userOld = await SuperAdmin.findOne({_id:userID})
    if(!userOld) {
        return res.json({user:"Not found"})
    }
    else {
        var {name, email, rollno, imageData } = req.body;
        const UpdateUser = {
            name: name === undefined || name === null ? userOld.name : name,
            username: userOld.username,
            email: email === undefined || email === null ? userOld.email : email,
            rollno: rollno === undefined || rollno === null ? userOld.rollno : rollno,
            image: imageData === undefined || imageData === null ? userOld.image : imageData
        };
    }

    try {
        await SuperAdmin.findOneAndUpdate({_id:userID}, UpdateUser, {new: true});
        return res.json({status:"Updated"})
    }
    catch(e) {
        return res.json({status:"Error"})
    }
}

exports.security = async(req,res) => {
    const {userID} = req.params;
    const userOld = await SuperAdmin.findOne({_id:userID})
    if(!userOld) {
        return res.json({user:"Not found"})
    }
    else {
        var {oldpassword, password} = req.body;
        if( await bcrypt.compare(oldpassword, userOld.password)) {
            const encPassword = await bcrypt.hash(password, 5);
            try {
                await SuperAdmin.findOneAndUpdate({_id:userID},{$set: {password: encPassword}}, {new: true})
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
}
