const Meet = require("../Schema/meeting");
const User = require("../Schema/superadmin")
const Student = require("../Schema/user");
const secret = process.env.secret
const jwt = require("jsonwebtoken")
const Department = require("../Schema/department")
const College = require("../Schema/college")

async function profileID(token) {
    var tok = token.headers.authorization;
    tok = tok.substring(7)
    var id;
    try {
        id = await jwt.verify(tok, secret);
    }
    catch(err) {
        id = null;
    }
    const user = await User.findOne({_id:id.id});
    if(user) {
        return user;
    }
    else {
	const student = await Student.findOne({_id:id.id});
	if(student)
		return student
	else
		return null
    }
}

/* 
- Listout all the meeting allocated for the department of the college.
*/

async function depart(id) {
	const dept = await Department.findOne({_id:id});
	return dept;
}

async function clg(id) {
	const college = await College.findOne({_id:id});
	return college.college;
}

exports.admin = async(req,res) => {
    const meeting = await Meet.find({});
    const meet = new Array();
    for(const a of meeting) {
	console.log(a)
	const department = await depart(a.department);
	const college = await clg(a.college);
	meet.push({
		_id: a?._id,
		title: a?.title,
		date: a?.date,
		link: a?.link,
		college: college,
		department: department?.department,
		year: department?.year,
		section: department?.section,
		semester: department?.semester
	})
    }
    return res.json({meeting: meet});
}

exports.adminMeet = async(req,res) => {
    const meetingID = req.params.meetingID
    const meeting = await Meet.findOne({_id:meetingID})
    if(meeting) {
        return res.json({meeting:meeting})
    }
    else {
        return res.json({meeting:"No Meeting found"})
    }
}

/*
- Listout all the meeting allocated for the department of their college.
*/
exports.superadmin = async(req,res) => {
    const user = await profileID(req);
    try {
        const meeting = await Meet.find({college: user.college});
    const meet = new Array();
    for(const a of meeting) {
        const department = await depart(a.department);
        const college = await clg(a.college);
        meet.push({
                _id: a?._id,
                title: a?.title,
                date: a?.date,
                link: a?.link,
                college: college?.college,
                department: department?.department,
                year: department?.year,
                section: department?.section,
                semester: department?.semester
        })
    }

        return res.json({meeting:meet});
    }
    catch(err) {
        return res.json({meeting:"Error"});
    }
}

exports.superadminMeet = async(req,res) => {
    const meetingID = req.params.meetingID
    const meeting = await Meet.findOne({_id:meetingID})
    if(meeting) {
        return res.json({meeting:meeting})
    }
    else {
        return res.json({meeting:"No Meeting found"})
    }
}

/* 
- Listout the meeting allocated for their department of their college.
*/
exports.student = async(req,res) => {
    const user = await profileID(req);
    try {
        const meeting = await Meet.find({college: user.college, department: user.department});
        return res.json({meeting: meeting});
    }
    catch(err) {
        return res.json({meeting: "Error",err:err});
    }
} 


/* 
Admin Access
------------

- Create a new meeting for the department of the college.
- Title, timing, link, department and college are the required values
*/
exports.newAdmin = async(req,res) => {
    const { title, timing, date, link, college, department } = req.body;

    const meeting = await Meet({
        title: title,
        date: date,
        timing: timing,
        link: link,
        college: college,
        department: department
    })

    meeting.save()
    .then((data) => { return res.json({status:"New Meeting"})})
    .catch((err) => { return res.json({status:"No meeting"})});
}

/* 
Superadmin Access
------------

- Create a new meeting for the department of their college.
- Title, timing, link and department are the required values
*/
exports.newSuperAdmin = async(req,res) => {
    const {title, timing,date, link, department } = req.body;
    const user = await profileID(req);
    console.log(user)
    const meeting = await Meet({
        title: title,
        date: date,
        timing: timing,
        link: link,
        college: user?.college,
        department: department,
    })

    meeting.save()
    .then((data) => {return res.json({status:"New meeting"})})
    .catch((err) => {return res.json({status:"No meeting"})});
}


exports.delete = async(req,res) => {
    const meetingID = req.params.meetingID;
    const meeting = await Meet.findOneAndDelete({_id:meetingID}).
    then(()=> {return res.json({status:"Deleted"})}).
    catch(() => {return res.json({status:"Something went wrong"})});
}
