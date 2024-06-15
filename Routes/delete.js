const mongoose = require("mongoose");

const Student = require("../Schema/user");
const Exam = require("../Schema/events");
const Event = require("../Schema/techevent");
const Department = require("../Schema/department");
const College = require("../Schema/college")
const Section = require("../Schema/sections")

/*
- Delete Request.
- Delete the allocated exam for the students.
- Identify by the examID. 
- It also delete the questions in both mcq and coding db.
*/
exports.exam = async(req,res) => {
    const {examID} = req.params;

    // Get exam detail;
    var examType = (await Exam.findOne({_id:examID}));
    var sections = examType.sections;
    // Delete the exam in db
    await Exam.deleteMany({_id:examID});

    // Delete the question in db
    for(let section of sections) {
        await Section.findOneAndDelete({_id:section}).
        catch((err) => { return res.json({status:"Something went wrong"})})
    }

    return res.json({status:"Deleted."})
}
 
/*
- Delete Request.
- Delete the student of the department on the college.
- Identify by the unique student _id.
*/
exports.user = async(req,res) => {
    const {userID} = req.params;

    // Delete the user
    await Student.findOneAndDelete({_id:userID})
    .catch(() => {return res.json({status:"Invalid User ID."})})

    return res.json({status:"User deleted."});
}

/*
- Delete the department of the college.
- Also delete the student studied in the department.
*/
exports.department = async(req,res) => {
    const {departmentID} = req.params;

    // Delete the department.
    await Department.findOneAndDelete({_id:departmentID})
    .catch(() => {return res.json({status:"Invalid Department ID."})})

    // Delete the college
    await Student.deleteMany({department: departmentID}).catch(() => {return res.json({status:"Invalid department ID"})});

    // Delete the exam
    await Exam.deleteMany({department: departmentID}).catch(() => {return res.json({status:"Invalid Department ID"})});

    return res.json({status:"Department deleted"});

}

/*
- Delete the college.
- Also the department and all the student of the college will be deleted.
*/
exports.college = async(req,res) => {
    const {collegeID} = req.params;
    if(!collegeID) {
        return res.status(404).json({status:"college id required!"})
    }
    // Delete the college
    await College.findOneAndDelete({_id:collegeID})
    .catch(() => {return res.json({status:"Invalid College ID."})})

    await Department.findOneAndDelete({college:collegeID}).catch(() => {return res.json({status:"Invalid College ID"})});

    await Student.deleteMany({college:collegeID}).catch(() => {return res.json({status:"Invalid College ID"})});

    await Exam.deleteMany({college:collegeID}).catch(() => {return res.json({status:"Invalid College ID"})});

    return res.json({status:"College deleted"});
}


/*
- Delete the event.
- Identify the event unique _id.
*/
exports.event = async(req,res) => {
    const {eventID} = req.params;

    // Delete the event
    await Event.findOneAndDelete({_id:eventID})
    .catch(() => {return res.json({status:"Invalid Event ID."})})

    return res.json({status:"Event deleted"});
}
