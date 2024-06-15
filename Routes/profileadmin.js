const SuperAdmin = require("../Schema/superadmin")
const User = require("../Schema/user")
const Admin = require("../Schema/admin")
const Exam = require("../Schema/events")
const College = require("../Schema/college")
const Department = require("../Schema/department")
const jwt = require("jsonwebtoken")
const secret = process.env.secret

const Coding = require("../Schema/programming")

async function profileID(token) {
    var tok = token.headers.authorization;
    tok = tok.substring(7);
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
        const superadmin = await SuperAdmin.findOne({_id:id.id});
        if(superadmin) {
            return superadmin
        }
        else {
            const admin = await Admin.findOne({_id:id.id});
            if(admin) {
                return admin
            }
            else null;
        }
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

async function profileData() {
    const exams = await Exam.find({});
    var upcomingM =0 ,upcomingC = 0;
    var ongoingM=0,ongoingC =0 ;
    var endM=0,endC=0;
    for(const exam of exams) {
            const status = await getTimeStatus(exam.start,exam.end);
            if(status=="upcoming") {
                    exam.exam === "Coding" ? upcomingC++ : upcomingM++;
            }
            else if(status == "ongoing") {
                    exam.exam==="Coding" ? ongoingC++ : ongoingM++;
            }
            else if(status == "ended") {
                    exam.exam === "Coding" ? endC++ : endM++;
            }
    }

    const data = {
        upcomingMCQ: upcomingM,
        upcomingCode: upcomingC,
        ongoingMCQ: ongoingM,
        ongoingCode: ongoingC,
        endMCQ: endM,
        endCode: endC,
    }
    return data;
}

async function profileDataSA(clg) {
    const exams = await Exam.find({college:clg});
    var upcomingM =0 ,upcomingC = 0;
    var ongoingM=0,ongoingC =0 ;
    var endM=0,endC=0;
    for(const exam of exams) {
            const status = await getTimeStatus(exam.start,exam.end);
            if(status=="upcoming") {
                    exam.exam === "Coding" ? upcomingC++ : upcomingM++;
            }
            else if(status == "ongoing") {
                    exam.exam==="Coding" ? ongoingC++ : ongoingM++;
            }
            else if(status == "ended") {
                    exam.exam === "Coding" ? endC++ : endM++;
            }
    }

    const data = {
        upcomingMCQ: upcomingM,
        upcomingCode: upcomingC,
        ongoingMCQ: ongoingM,
        ongoingCode: ongoingC,
        endMCQ: endM,
        endCode: endC,
    }
    return data;
}

async function dept(id) {
    const department = await Department.findOne({_id:id});
    return department
}

async function clg(id) {
    const college = await College.findOne({_id:id})
    return college.college;
}

exports.admin = async(req,res) => {
        const user = await profileID(req);
        if(!user) {
            return res.json({status:"User not found"})
        }
        const exam = await profileData();
        const scoreboard = new Array();
    const student_list = await User.find({});
    let i = 0;
    for( const stud of student_list) {
        if(i==10)
            break;
        const department = await dept(stud?.department)
        scoreboard.push({
            name: stud?.name,
            college: await clg(stud?.college),
            department: department?.department,
            year: department?.year,
            semester: department?.semester,
            section: department?.section,
            score: stud?.OAScore
        })
        i++;
    }
        return res.json({exam:exam,scoreboard:scoreboard});
}

exports.superadmin = async(req,res) => {
        const user = await profileID(req);
        if(!user) {
            return res.json({status:"User not found"})
        }
        const exam = await profileDataSA(user.college);
        const scoreboard = new Array();
    const student_list = await User.find({college:user.college});
    let i = 0;
    for( const stud of student_list) {
        if(i==10)
            break;
        const department = await dept(stud?.department)
        scoreboard.push({
            name: stud?.name,
            college: await clg(stud?.college),
            department: department?.department,
            year: department?.year,
            semester: department?.semester,
            section: department?.section,
            score: stud?.OAScore
        })
        i++;
    }
    let colg = await clg(user.college);
        return res.json({exam:exam,college:colg,scoreboard:scoreboard});
}
