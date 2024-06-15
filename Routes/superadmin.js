// Libraries
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const secret = process.env.secret || "SuperK3y";

// Schema
const User = require("../Schema/superadmin")
const College = require("../Schema/college")
const Department = require("../Schema/department")
const Exam = require("../Schema/events")
const Event = require("../Schema/techevent")
const Performance = require("../Schema/performance")
const Student = require("../Schema/user")
const Admin = require("../Schema/admin")
const Section = require('../Schema/sections');

async function profileID(token) {
    var tok = token.headers.authorization;
    var id;
    try {
        tok = tok.slice(7,tok?.length)
        id = jwt.verify(tok, secret);
    }
    catch(err) {
        id = null;
    }
    const user = await User.findOne({_id:id.id});
    if(user) {
        return user;
    }
    else {
        return null;
    }
}

function getTimeStatus(starttime, endtime) {
    const currentTime = new Date();
    const startTime = new Date(starttime);
    const endTime = new Date(endtime);
  
    if (currentTime < startTime) {
      return "upcoming";
    } else if (currentTime >= startTime && currentTime <= endTime) {
      return "ongoing";
    } else {
      return "ended";
    }
}


function formatDateTime(inputDateTime) {
    return inputDateTime;
}

function formatDateWithMonthAndTime(inputDateTime) {
    const dateTime = new Date(inputDateTime);
    const monthNames = [
      "January", "February", "March", "April", "May", "June", "July",
      "August", "September", "October", "November", "December"
    ];
    const formattedDate = `${monthNames[dateTime.getMonth()]} ${dateTime.getDate()}, ${dateTime.getFullYear()} ${dateTime.toLocaleTimeString()}`;
  
    return formattedDate;
}

async function departmentName(id) {
    const dept = await Department.findOne({_id: id});
    if(!dept) {
        return null;
    }
    else {
        return dept;
    }
}

async function CollegeName(id) {
    const college = await College.findOne({_id:id})
    if(!college) {
        return null;
    }
    else {
        return college;
    }
}

async function examStatus(start, end) {
    const timeNow = new Date().getTime();
    if( start >= timeNow && end <= timeNow) {
        return "Ongoing";
    }
    if( end>= timeNow) 
        return "Ended";
    else
        return "Upcoming";
}

async function scoreof(examID, students) {
    const studentDetail = new Array();
    for(let student of students) {
        const performance = await Performance.findOne({examid:examID,studentid:student})
        if(!performance) {
            studentDetail.push({
                _id: student?._id,
                name: student?.name,
                rollno:student?.rollno,
                username:student?.username,
                obtainpoint: 0,
            })
        }
        else {
            studentDetail.push({
                _id: student?._id,
                name: student?.name,
                rollno:student?.rollno,
                username:student?.username,
                obtainpoint: performance?.obtainpoint,
            })
        }
    }
    return studentDetail;
}

/*
- Listout the exams allocated for the department of their students.
- Both mcq and coding exams.
*/
exports.exam = async(req,res) => {
    const user = await profileID(req);
    try {
        const exams = await Exam.find({college:user.college});
        var examList = new Array();

        for(const exam of exams) {
            const college = await CollegeName(exam.college);
            const departmentData = await Department.findOne({_id:exam.department});
       	    if(!departmentData || ! college ){
                continue;
            }
            else {
                examList.push({
                    _id: exam.id,
                    title: exam.title,
                    college: college?.college,
                    department: departmentData?.department,
                    year: departmentData?.year,
                    semester: departmentData?.semester,
                    section: departmentData?.section,
                    date: formatDateWithMonthAndTime(exam.date).split(',')[0],
                    start: formatDateTime(exam.start),
                    end: formatDateTime(exam.end),
                    category: exam?.category,
                    duation: exam?.duration,
                    sections: (exam?.sections).length,
                    status: getTimeStatus(exam?.start,exam?.end),
                })
            }
        }
        return res.json({exams:examList})
    }
    catch(err) {
        return res.json({exams: "Error",err:err})
    }
}
exports.examDetail = async (req,res) => {
    const {examID} = req.params;

    const exam = await Exam.findOne({_id:examID});
    if(!exam) {
        return res.json({status:"Not found"})
    }
    const college = await College.findOne({_id:exam?.college});
    const department = await Department.findOne({_id:exam?.department})

    const students = await Student.find({ college: exam?.college, department: exam?.department }, { __v: 0,department:0,college:0, username: 0, password: 0, role: 0,image:0 }).sort({ name: 'asc' });
    const student = await scoreof(examID, students);

    return res.json({
        title:exam?.title,
        college: college?.college,
        department: department?.department,
        year: department?.year,
        semester: department?.semester,
        section: department?.section,
        date: formatDateWithMonthAndTime(exam?.date).split(',')[0],
        start: formatDateTime(exam?.start),
        end: formatDateTime(exam?.end),
        status:getTimeStatus(exam?.start,exam?.end),
	    category: exam?.exam,
        students: student,
        point:exam.overallRating
    });
};


/*
Superadmin Panel Access.
-------------------

- Create a new exams
- Generate a unique ID for exam.
- Also the call the mcq or coding function to save the question in corresponding database.
*/
exports.newExam = async (req,res) => {
    const user = await profileID(req);
    const { title,category, date, start,end, department, sections} = req.body;
    var overAllPoint = 0;
    var overDuration = 0;
    var sectionsID = await Promise.all(
        sections.map(async (section) => {
            const {name,category,hours,minutes,questions} = section;
            let duration = (hours*60) + minutes;
            overDuration += duration;
            // Calculate the score
            if(category==="mcq"){
                for(let question of questions) {
                    overAllPoint+= question?.rating;
                }
            }
            else {
                for(let question of questions) {
                    // Output
                    for(let out of question?.output) {
                        overAllPoint += out?.rating
                    }
    
                    // Testcase
                    for(let test of question?.testcase) {
                        overAllPoint += test?.rating
                    }
                }
            }
            const sect = await Section({
                name: name,
                category: category,
                time: duration,
                questions: questions
            });
    
            return sect.save()
            
        })
    )

    // Create a exam 
    var newExam = await Exam({
        title: title,
        category: category,
        date: date,
        start: start,
        end: end,
        duration: overDuration,
        sections: sectionsID.map((section) => section?._id),
        department: department,
        college: user.college,
        overallRating: overAllPoint
    });
    // Save the test
    newExam.save()
    .then( (newEvt) => {
        res.json({response:`Added new exam`})
    })
    .catch((err) => res.json({response:`Something wrong.\nBacktrack\n${err}`}))
}

/*
- Create a new department for their college.
- The collection have department, year, semester and section.
- Database name is departments.
*/
exports.newDept = async(req,res) => {
    const user = await profileID(req);
    const { department, year, semester, section } = req.body;
    const deptExist = await Department.findOne({college:user.college, department:department, year: year, semester: semester, section: section})
    if(deptExist) {
        return res.json({status:"Already exist"})
    }
    const clg = await Department({
        college: user?.college,
        department: department,
        year: year,
        semester: semester,
        section: section,
    });

    clg.save()
    .then((data) => {return res.json({status:"Added Department"})})
    .catch((err) => {return res.json({status:"Something went wrong"})})
}

/*
- Get all the department of their college.
- Return the department name, year, semester and section and college name
*/
exports.dept = async(req,res) => {
    const user = await profileID(req);
    const college = await user?.college;
    const department = await Department.find({college: college});
    return res.json({department: department});
}

exports.delDept = async(req,res) => {
	const departmentID = req.params.departmentID;
	const process = await Department.findOneAndDelete({_id:departmentID})
	return res.json({status:"Deleted"})
}
/*
- Get all the student detail of the specific department on their college.
- Return the user deatils such as name, username, email, Overall score and roll number.
*/
exports.student = async(req,res) => {
    const user = await profileID(req);
    if(!user) {
        return res.json({status:"User not found."})
    }
    const college = user?.college;
    const department = req.params.departmentID;
    const student = await Student.find({college: college, department: department});
    const stu = new Array();
    const clg = await College.findOne({_id:college});
    const dept = await Department.findOne({_id:department});
    for(const a of student) {
	stu.push({
		_id:a?._id,
		name:a?.name,
		username:a?.username,
		rollno:a?.rollno,
		email: a?.email,
		OAScore:a?.OAScore
    })
   }
    return res.json({students:stu,college:clg.college,department:dept.department,year:dept.year,semester:dept.semester,section:dept.section})
}

/*
New Student.
- POST Request
- Create a new user, 
*/
exports.newStudent = async(req,res) => {
    const user = await profileID(req);
    const department = req.params.departmentID;
    const { name, username, email, password, rollno } = req.body;
    const college = user.college;

    const student = await Student({
        name: name,
        username: username,
        email: email,
        password: await bcrypt.hash(password,5),
        rollno: rollno,
        college: college,
        department: department,
        role: "student",
        OAScore: 0,
        codeExam: new Array(),
        exams: new Array(),
        completion: new Array(),
    });

    user.save()
    .then( (data) => res.status(200).send({response:"Successfully created a user "}))
    .catch( (err) => res.status(301).send({response:"Something went wrong"}));
}

/*
- Listout the events allocated for the department of their students.
*/
exports.event = async(req,res) => {
    const user = await profileID(req);
    const tech = await Event.find({college:user.college})
    if(tech) {
        return res.json({event: tech});
    }
    else {
        return res.json({event:"No event"});
    }
}

exports.profile = async(req,res) => {
    const user = await profileID(req);
    const exam = await Exam.find({college:user.college});
    const student = await Student.find({college: user.college}).sort({OAScore:-1});
    const exams = new Array();
    for(const ex of exam) {
        const status = await examStatus(ex.start, ex.end);

        const json = {
            id: ex.id,
            title: ex.title,
            date: ex.date,
            start: ex.start,
            end: ex.end,
            category: ex.exam,
            status: status,
            hours: ex.hours,
            minutes: ex.minutes,
        }
    }
    return res.json({exam: exams, student: student})

}


exports.getSA = async(req,res) => {
    const superadmin = await User.find({});
    var user = new Array(); 
    for(const a of superadmin) {
        user.push({
            _id: a?._id,
            college: (await CollegeName(a?.college)).college,
            name: a?.name,
            username: a?.username,
            email: a?.email,
        })
    }
    return res.json({superadmins:user})
}

exports.getSAS = async(req,res) => {
    const { superadminID } = req.params;
    const superadmin = await User.findOne({_id:superadminID});
    return res.json({superadmins:superadmin});
}

exports.delSAS = async(req,res) => {
    const { superadminID } = req.params;
    const superadmin = await User.findOneAndDelete({_id:superadminID});
    return res.json({status:"Deleted a superadmin user"});
}

exports.getDept = async(req,res) => {
    const user = await profileID(req);
    const college = await user.college;
    const departmentID = req.params.departmentID
    const students = await User.find({college: college, department: departmentID});
    var student = new Array();
    for(const a of students) {
        var b = await departmentName(a?.department)
        student.push({
            name: a?.name,
            username: a?.username,
            rollno: a?.enroll,
            email: a?.email,
            college: (await CollegeName(a?.college)).college,
            department: b.department,
            year: b.year,
            semester: b.semester,
            section: b.section
        })
    }
    return res.json({students: student});
}

exports.getAD = async(req,res) => {
    const admins = await Admin.find({},{password:0});
    return res.json({admins:admins})
}
