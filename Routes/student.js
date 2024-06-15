const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")

const Exam = require("../Schema/events")
const Event = require("../Schema/techevent")
const Activity = require("../Schema/loginactivity.js")
const MCQ = require("./mcqs");
const Code = require("./CodingQN")
const CodeDB = require("../Schema/programming")
const MCQDB = require("../Schema/mcq");

const Department = require("../Schema/department")
const Student = require('../Schema/user');
const College = require("../Schema/college");
const Section = require("../Schema/sections")
const secret = process.env.secret || "SuperK3y";
const Timer = require("../Schema/examtimer.js");
const Performance = require("../Schema/performance.js")
const Scoring = require("../Schema/scores.js")
const ScoreBoard = require("../Schema/scoreboard.js")
const Rank = require("../Schema/ranking.js")

// Execution files
const Python = require("./python");
const C = require("./c")
const Java = require("./java");
const Score = require("../Schema/scores.js");

async function profileID(authHeader)  {
    var token;
    if( authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }
    try{
        var user = jwt.verify(token,secret);
        return user.id
    }
    catch{
        return null;
    }
}

async function college(id) {
    const name = await College.findOne({_id:id});
    return name;
}

async function department(id) {
    const dept = await Department.findOne({_id:id});
    return dept;
}

async function profile(id) {
    const user = await Student.findOne({_id:id});
    return user;
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
 
async function profileData(id,clg,dept) {
	const exams = await Exam.find({college:clg,department:dept});
    if(!exams || exams.length === 0) {
        return res.json({exams:"No exam found"})
    }
	var upcomingM =0 ,upcomingC = 0;
	var ongoingM=0,ongoingC =0 ;
	var endM=0,endC=0;
	var scoreboard=0;
	var mcq=0;
	var code= new Array();
	var perc = 0;
	for(const exam of exams) {
		const status = getTimeStatus(exam.start,exam.end);
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
	const mcqExamID = new Array();
	for(const a of id.exams) {
		mcqExamID.push(a.examID);
	}
	const CodeExamID = new Array();
	for(const b of id.codeExam) {
		CodeExamID.push(b.examID);
	}

	const codeID = [...new Set(CodeExamID)];

	if(codeID && mcqExamID) {
		const mcqQ = await MCQDB.find({examID:mcqExamID});
		const CodQ = await CodeDB.find({examID:codeID});
		for(const a of mcqQ){
			perc+= a.rating;
		}
		for(const b of CodQ) {
			perc+= b.rating;
		}
	}

	mcq = (id.exams).length;
	code = (id.codeExam).length;
	scoreboard = id.OAScore;
	const data = {
	upcomingMCQ: upcomingM,
	upcomingCode: upcomingC,
	ongoingMCQ: ongoingM,
	ongoingCode: ongoingC,
	endMCQ: endM,
	endCode: endC,
	score: scoreboard,
	percentage: (scoreboard/perc)*100,
	attendMCQ: mcq,
	attendCode: code,
}
	return data;
}

/*
[Not in use, old feature]
*/
async function examAttend(user,exam,examID) {
    if(exam == 'MCQ') {
        const compl = user.completion;
        for(const ex of compl) {
            if(ex==examID) {
                return "Attended"
            }
        }
        return "Not attended yet."
    }
    else if( exam == "Coding") {
	var i = 0;
        const compl = user.codeExam;
        for( const ex of compl) {
	    if(ex.examID == examID) {
		i++;
            }
        }
	const codeqn = await Code.display(examID);
	const noq = codeqn.length;
	if( i== noq)
		return "Attended"
	else if(i>0)
		return "Not fully completed."
	else
	        return "Not attended yet."
    }
}


async function UpdateScoreBoard(student,examID,sectionID,category,overall,obtain) {
    const dept = await Department.findOne({_id:student.department});
    const colg = await College.findOne({_id:student.college})
    if(!colg) {
        return res.json({status:"College ID not found"})
    }
    if(!dept) {
        return res.json({status:"Department ID not found"})
    }
    const existSB = await ScoreBoard.findOne({studentid:student._id});
    if(!existSB) {
        const scoreboard = await ScoreBoard({
            studentid: student._id,
            studentName: student.name,
            department: dept._id,
            departmentName: dept.department,
            year: dept.year,
            semester: dept.semester,
            section: dept.section,
            college: colg._id, 
            collegeName: colg.name,
            exams: [{
                examid:examID,
                sectionID: sectionID,
                category:category, 
                overall:overall,
                obtain: obtain
            }],
            scores: obtain
        });
    
        await scoreboard.save().catch(() => {return res.json({status:"Something went wrong on save the scoreboard. Line 215"})})
    
        let average = (obtain/overall)*100
        let rankPos = average >= 80 ? "Developer+" : (average <80 && average>=60) ? "Developer" : (average <60 && average>=40) ? "Dev" : "Junior dev"
    
        const ranking = await Rank({
            studentid: student._id,
            studentName: student.name,
            department: dept._id,
            departmentName: dept.name,
            college: colg._id,
            obtain: obtain,
            overall: overall,
            average: average,
            rank: rankPos
        });

        ranking.save().catch(() => {return res.json({status:"Something went wrong on save the ranking document"})})
    }

    else {
        await ScoreBoard.findOneAndUpdate({studentid:student._id},{$push: {exams:{examid:examID,sectionID:sectionID,category:category,overall:overall,obtain:obtain}}, $inc: {scores:obtain}});
        const rankSt = await Rank.findOne({studentid:student._id});

        let existObt = rankSt?.obtain;
        let existOve = rankSt?.overall;

        let average = ((existObt + obtain)/ (existOve+overall))*100;
        let rankPos = average >= 80 ? "Developer+" : (average <80 && average>=60) ? "Developer" : (average <60 && average>=40) ? "Dev" : "Junior dev"
    

        await Rank.findOneAndUpdate({studentid:student._id},{$inc:{overall:overall,obtain:obtain},average:average,rank:rankPos})
    }
    
}

/*
Student Panel Program
---------------------

- Return the required data on the dashboard page on the website.
- Such as Overall score and user details.
*/

exports.profileImage = async(req,res) => {
    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID);
    return res.json({
        image: user?.image
    })
}

exports.profile = async(req,res) => {
    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID);
    const clg = await college(user?.college);
    const dept = await department(user?.department);

    if(!dept || !clg )
	    return res.json({status:"College and department of the student deleted"});

    return res.json({
        name: user.name,
	    image: user.image,
	    college: clg.college,
        department: dept.department,
        year: dept.year,
        semester: dept.semester,
        section: dept.section,
    });
}

/*
- Listout the exams allocated for the specific department of the students.
- Both mcq and coding exams.
*/
exports.exam = async (req, res) => {
    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID);
    const clg = await college(user?.college);
    const dept = await department(user?.department);
  
    const exams = await Exam.find({ college: user?.college, department: user?.department }, {__v:0});
    const examList = await Promise.all(exams.map(async (exam) => {
      const start = exam?.start;
      const end = exam?.end;
      
      var status = getTimeStatus(start, end);
      const date = formatDateWithMonthAndTime(exam.date).split(',');
      const startTime = formatDateTime(start);
      const endTime = formatDateTime(end);
      const Attended = await Performance.findOne({studentid:userID,examid:exam?._id})
      var status;
      return {
        _id: exam?._id,
        title: exam?.title,
        status: status,
        date: date[0],
        start: startTime,
        end: endTime,
	    duration: exam?.duration,
        category: exam?.exam,
        sections: (exam?.sections).length,
        attendStatus: status,
      };
    }));

    return res.json({ exams: examList });
};

/*
- Get the exam detail
- Not the question
- Just the start, time and type of exam.
*/
exports.examDetail = async (req,res) => {
    const {examID} = req.params;
    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID);
    const exam = await Exam.findOne({_id:examID});
    if(!exam) {
        return res.json({status:"No exam id found"});
    }
    const question = await Promise.all(
        (exam.sections).map(async (section) => {
            const sec = await Section.findOne({_id:section},{'questions.answer':0});
            var timerExist = await Timer.findOne({examid:examID,sectionid:sec?._id,studentid:userID});
            if(timerExist) {
                sec.timeLeft = ((new Date().getTime() - new Date(timerExist?.startTime).getTime()) / 60000); 
                return sec;
            }
            return sec;
        })
    )
    const college = await College.findOne({_id:exam?.college});
    const department = await Department.findOne({_id:exam?.department})

    return res.json({
        title:exam.title,
        college: college.college,
        department: department?.department,
        year: department?.year,
        semester: department?.semester,
        section: department?.section,
        date: formatDateWithMonthAndTime(exam.date).split(',')[0],
        start: formatDateTime(exam?.start),
        end: formatDateTime(exam?.end),
        status:getTimeStatus(exam?.start,exam?.end),
	    category: exam?.exam,
        sections: question,
        update:"Remaining timing will be update soon"
    });
}
  
/*
- Get the exam deatils
- Student panel access.
- Also get the coding question of the corresponding type such as mcq and coding.
*/


exports.examStart = async (req,res) => {
    const { examID,sectionID } = req.params;
    var exam = await Exam.findOne({_id: examID});
    var section = await Section.findOne({_id:sectionID},{'questions.answer':0})
    if(!exam || !section) {
        return res.json({status:"No exam found."})
    }
    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID);
    if(!user) {
        return res.json({status:"User not found"})
    }
    const loginAct = await Activity.findOne({user_id:user._id})

    if(!loginAct) {
        const loginCreate = Activity({user_id:user._id,ipaddress: req.ip, userAgent: req.get("user-agent"), date: new Date() })
        loginCreate.save();
    }

    const Attended = await Performance.findOne({studentid:userID,examid:examID})
    if(Attended && Attended.category === "mcq") {
            return res.json({status:"Already attended this exam"})
    }
    else {
        var timerExist = await Timer.findOne({examid:examID,sectionid:sectionID,studentid:userID});
        if(!timerExist) {
            const timer = await Timer({
                studentid: userID,
                examid: examID,
                sectionid: sectionID,
                startTime: new Date().getTime(),
                time: section?.time
            }) 
            timer.save().then((doc) => {timerExist = doc});
            if(section.category === "mcq") {
                return res.json({section: section, exam: exam, timing:section?.time})
            }
            else {
                if(Attended && (Attended.category === "coding" || Attended.category === "both")) {
                    let questionsArray = new Array();
                    var attendedSection = Attended.score;
                    let sec = await Scoring.findOne({_id:attendedSection[sectionID], category:'coding', sectionid:sectionID})
                    var questions = sec.questions;
                    var questions = sec.questions;
                    var qns = section.questions;
                    for(let qn of qns ) {
                        if(!questions.includes(qn?.number)) {
                            questionsArray.push(qn)
                        }
                    }

                    // Filter the questions first:
                    
                    const sectionJson = {
                        _id: sectionID,
                        name: section.name,
                        category: section.category,
                        time: section.time,
                        questions: questionsArray,
                    }
                    return res.json({section: sectionJson, exam: exam, timing:section?.time})
                }
                else {
                    return res.json({section: section, exam: exam, timing:section?.time})
                }
            }
        }
        else if((((new Date().getTime() - new Date(timerExist.startTime).getTime()) / 60000) < section.time) ) {
            if(section.category === "mcq") {
                return res.json({section: section, exam: exam, timing:parseInt((new Date().getTime() - new Date(timerExist.startTime).getTime()) / 60000)})
            }
            else {
                if(Attended && (Attended.category === "coding" || Attended.category === "both")) {
                    let questionsArray = new Array();
                    var attendedSection = Attended.sections;
                    for(let sect of attendedSection) {
                        let sec = await Scoring.findOne({_id:sect,category: 'coding', sectionid: sectionID})
                        var questions = sec?.questions;
                        var qns = section?.questions;
                        for(let qn of qns ) {
                            if(!questions.includes(qn.number)) {
                                questionsArray.push(qn)
                            }
                        }
                    }
                    // Filter the questions first:
                    
                    const sectionJson = {
                        _id: sectionID,
                        name: section?.name,
                        category: section?.category,
                        time: section?.time,
                        questions: questionsArray,
                    }
                    return res.json({section: sectionJson, exam: exam, timing:parseInt((new Date().getTime() - new Date(timerExist.startTime).getTime()) / 60000)})
                }
                else {
                    return res.json({section: section, exam: exam, timing:section.time - parseInt((new Date().getTime() - new Date(timerExist.startTime).getTime()) / 60000)})
                }
            }
        }
        else {
            return res.json({status:'You timing for exam is over.'})
        }


    }
    
}

exports.examEval = async(req,res) => {
    const { examID,sectionID } = req.params;
    var exam = await Exam.findOne({_id: examID});
    var section = await Section.findOne({_id:sectionID})
    var secQn = section.questions;
    const {questions} = req.body;

    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID)

    var timerExist = await Timer.findOne({examid:examID,sectionid:sectionID,studentid:userID});
    if(!timerExist) {
        return res.json({status:"You didn't attend the exam yet."})
    }
    var timeLeft = ((new Date().getTime() - new Date(timerExist.startTime).getTime()) / 60000); 
    timeLeft = timeLeft < 0 ? Math.abs(timeLeft) : timeLeft;
    let performanceOfStudent = await Performance.findOne({examid:examID,sections: { $elemMatch: { $eq: sectionID}}});
    if(performanceOfStudent !== null && section.category === "mcq") {
        let result = await Scoring.findOne({_id: performanceOfStudent.score[sectionID]})
        return res.json({status:"You have been already attended this exam.", code: 402,result:result})
    }

    else if(timeLeft > section.time) {
        return res.json({status:"Time is over. Can't evaluate.",code:401})
    }
    else if(section.category === "mcq") {
        // Evaluation Process the mcq question
        var mcqAnalysis = new Array();
        var rating = 0;
        var overPoint = 0;
        var attendQn = new Array();
        
        // Iteration the question user body
        for(let question of questions) {

            // Iteration of section question
            for(let qn of secQn) {

                // If number of question of both equal then check for answer of it
                if(question.number === qn.number) {
                    if(question.answer === qn.answer) {
                        rating += qn.rating;
                        mcqAnalysis.push({
                            number: question.number,
                            choosen: question.answer,
                            correct: qn.answer,
                            status: true
                        })
                    }
                    else {
                        mcqAnalysis.push({
                            number: question.number,
                            choose: question.answer,
                            correct: qn.answer,
                            status: false
                        })
                    }
                    overPoint += qn.rating;
                    attendQn.push(question.number);
                }
            }
        }

        let newScore = await Scoring({
            sectionid: sectionID,
            category: section.category,
            points: rating,
            overPoint: overPoint,
            timetaken: timeLeft,
            questions: attendQn,
            performance: mcqAnalysis

        });
        await newScore.save().then(async (doc) => {
            let newPerformance = await Performance({
                studentid: userID,
                examid: examID,
                sections: [sectionID],
                score: { [sectionID] : doc._id},
                category: exam.category,
                points: overPoint,
                obtainpoint: rating,
            });

            await newPerformance.save().then(async () => {
                let sec = await Section.findOne({_id: sectionID},{questions:0})
                UpdateScoreBoard(user,examID,sectionID,section.category,overPoint,rating)
                return res.json({sectionID: sectionID, examID: examID, section: sec,overPoint:overPoint, obtainPoint: rating, timetaken:timeLeft,code:200})
            }).catch((err) => {
                return res.json({status:"Something went wrong!!", code:301})
            })
        }).
        catch((err) => {
            return res.json({status:"Something went wrong", code:301,error:err})
        })
    }

    else if(section.category === "coding") {
        const {questions} = req.body;
        let sectionQN;
        for(let sec of section.questions) {
            if(sec.number === questions.number) {
                sectionQN = sec
            }
        }
        // Verified Output
        const {result,testcase} = await Code.evaluate(examID, questions,sectionQN, userID,section.show);

        return res.json({result,testcase})
    }
}


exports.examSubmit = async(req,res) => {
    const { examID,sectionID } = req.params;
    var exam = await Exam.findOne({_id: examID});
    var section = await Section.findOne({_id:sectionID})
    var secQn = section.questions;
    const {questions} = req.body;

    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID)

    var timerExist = await Timer.findOne({examid:examID,sectionid:sectionID,studentid:userID});
    if(!timerExist) {
        return res.json({status:"You didn't attend the exam yet."})
    }
    var timeLeft = ((new Date().getTime() - new Date(timerExist.startTime).getTime()) / 60000); 
    timeLeft = timeLeft < 0 ? Math.abs(timeLeft) : timeLeft;
    let performanceOfStudent = await Performance.findOne({examid:examID,sections: { $elemMatch: { $eq: sectionID}}});
    if(performanceOfStudent !== null && section.category === "mcq") {
        let result = await Scoring.findOne({_id: performanceOfStudent.score[sectionID]})
        return res.json({status:"You have been already attended this exam.", code: 402,result:result})
    }

    else if(timeLeft > section.time) {
        return res.json({status:"Time is over. Can't evaluate.",code:401})
    }

    else if(section.category === "coding") {
        const {questions} = req.body;
        let sectionQN;
        for(let sec of section.questions) {
            if(sec.number === questions.number) {
                sectionQN = sec
            }
        }
        // Verified Output
        var {result,testcase} = await Code.evaluate(examID, questions,sectionQN, userID,section.show);


        var rating = 0;
        var overPoint = 0;
        var question = section.questions;

        result.map((qn,item) => {
            if(qn.status === "correct") {
                rating += qn.rating
            }
            else if(qn.status === "incorrect"){
                rating -= qn.rating
            }
            overPoint += qn.rating
        })

        testcase = testcase[0]

        testcase.map((qn,item) => {
            if(qn.status === "correct") {
                rating += qn.rating
            }
            else if(qn.status === "incorrect"){
                rating -= qn.rating
            }
            overPoint += qn.rating
        })

        var studentPerformance = {
            number: questions.number,
            output: result,
            testcase: testcase
        }

        let studentScore = await Scoring.findOne({sectionid:sectionID, category: section.category});
        if(!studentScore) {
            let newScore = await Scoring({
                sectionid: sectionID,
                category: section.category,
                points: rating,
                overPoint: overPoint,
                timetaken: timeLeft,
                questions: [questions.number],
                performance: studentPerformance
            });

            await newScore.save().then(async (doc) => {

                let tmp = await Performance.findOne({examid:examID, studentid: userID, sections: {$elemMatch: {$nin : sectionID}}})
                if(!tmp){
                    let newPerformance = await Performance({
                        studentid: userID,
                        examid: examID,
                        sections: [sectionID],
                        score: { [sectionID] : doc._id},
                        category: exam.category,
                        points: overPoint,
                        obtainpoint: rating,
                    });
 
                    await newPerformance.save().then(async () => {
                        let sec = await Section.findOne({_id: sectionID},{questions:0})
                        UpdateScoreBoard(user,examID,sectionID,section.category,overPoint,rating)
                        return res.json({sectionID: sectionID, examID: examID, section: sec,overPoint:overPoint, obtainPoint: rating, timetaken:timeLeft,result: result, testcase : testcase,code:200})
                    }).catch((err) => {
                        return res.json({status:"Something went wrong!!", code:301})
                    })
                }
                else {
                    await Performance.findOneAndUpdate({examid:examID, studentid:userID}, {$push: { sections: sectionID, score: {[sectionID]:doc._id}}, $inc: {points: overPoint, obtainpoint: rating}}, {new: true})
                    let sec = await Section.findOne({_id: sectionID},{questions:0})
                    UpdateScoreBoard(user,examID,sectionID,section.category,overPoint,rating)
                    return res.json({sectionID: sectionID, examID: examID, section: sec,overPoint:overPoint, obtainPoint: rating, timetaken:timeLeft,result: result, testcase : testcase,code:200})
                        
                }
            }).
            catch((err) => {
                console.log(err,"eroor")
                return res.json({status:"Something went wrong", code:301,error:err})
            })


        }
        else {
            if(studentScore.questions.includes(questions.number)){
                return res.json({status:"You have been already submit it", sectionID:sectionID, examID:examID, sectionResult: studentScore})
            }
            let updateScore = await Scoring.findOneAndUpdate({sectionid:sectionID,category:section.category}, { $push: {questions: questions.number, performance:studentPerformance}})
            console.log(rating,overPoint)
            let updatePerfo = await Performance.findOneAndUpdate({studentid:userID,examid:examID,sections: { $elemMatch : {$eq: sectionID}}}, {$inc: {points: overPoint, obtainpoint: rating}},{new: true})
            let sec = await Section.findOne({_id: sectionID},{questions:0})
            return res.json({sectionID: sectionID, examID: examID, section: sec,overPoint:overPoint, obtainPoint: rating, timetaken:timeLeft,result: result, testcase : testcase,code:200})
        }
    }
}


exports.examAnswer = async(req,res) => {
    const { examID,sectionID } = req.params;
    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID);
    var exam = await Exam.findOne({_id: examID});
    if(exam.show === false) {
        return res.json({status:"Can't show the answer for this exam."})
    }
    var section = await Section.findOne({_id:sectionID})
    var secQn = section.questions;
    const perform = await Performance.find({studentid:user._id})
    if(!perform) {
        return res.json({status:"Not attended yet!"})
    }
    var scoring = 0;
    for(let each of perform) {
        for(let sec of each.score){
            const scores = await Scoring.findOne({sectionid:sectionID,_id:sec[sectionID]})
            if(scores) {
                scoring = scores;
            }
        }
    }
    
    return res.json({section:section,performance:scoring})
}
/* 
- Get the coding questions deatils
- Student panel access.
*/

 
/*
- Get the event deatils
- Student panel access.
*/
exports.event = async(req,res) =>  {
    const event = await Event.find({},{username:0,department:0,year:0,semester:0,section:0});
    const eventList = new Array();
    for(const evt of event) {
        const date = formatDateWithMonthAndTime(evt.date).split(',');

        const json = {
            title:evt.title,
            _id:evt._id,
            college:evt.college,
            eventlink:evt.eventlink,
            image:evt.image,
            date:date[0],
        };

        eventList.push(json)
    }
    return res.json({event:eventList})
}
 
/*
- Get the scoreboard deatils
- Student panel access.
- ALl the student of the department scorepoint will be return.
*/
exports.scoreboard = async (req, res) => {
    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID);
    const clg = await College.findOne({ _id: user.college });
    const users = await Student.find({ college: user.college });
    var std = new Array();
  
    for (const stud of users) {
      const deptname = await Department.findOne({ _id: stud.department });
  
      const json = {
        register: stud.register,
	    rollno: stud.rollno,
        name: stud.name,
        college: clg.college,
        department: deptname.department,
        year: deptname.year,
        semester: deptname.semester,
        section: deptname.section,
        score: stud.OAScore,
      };
  
      std.push(json);
    }
  
    return res.json({ score: std });
  };
// Admin scoreboard endpoint to view all students' scores
exports.adminScoreboard = async (req, res) => {
    try {
        // Decode the token and extract user information
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.decode(token);
        console.log('Decoded Token:', decodedToken); // Debugging log

        // Ensure user has admin or superadmin role
        if (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Fetch all students
        const students = await Student.find({});
        const studentDetailsList = [];

        for (const student of students) {
            const college = await College.findOne({ _id: student.college });
            const department = await Department.findOne({ _id: student.department });

            // Check if the college and department exist
            if (!college) {
                console.warn(`College not found for student ID: ${student._id}`);
                continue; // Skip this student if the college is not found
            }
            if (!department) {
                console.warn(`Department not found for student ID: ${student._id}`);
                continue; // Skip this student if the department is not found
            }

            const studentDetails = {
                studentid: student._id,
                register: student.register,
                rollno: student.rollno,
                name: student.name,
                college: college.college,
                department: department.department, 
                year: department.year,
                semester: department.semester,
                section: department.section,
                score: student.OAScore,
            };

            studentDetailsList.push(studentDetails);
        }

        return res.json({ score: studentDetailsList });
    } catch (error) {
        console.error('Error fetching scoreboard details:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/*
Evaluate the question.
- Identify the user detail with the token, which have the user id.
- If Not the coding question.
- Return the score and correct answered question number.
- Otherwise get the question detail from the coding collection with examID and question number.
- Store the input array of the question on the variable.
- Pass each input value and coding in corresponding execution function such as python, c, cpp and java.
- The return data have the status, if status is Compilation error, return it.
- If correct status, return correct. Or incorrect, then return incorrect. 
- This last step is common for all programming language.
- The Same input array function is repeated for testcase array. But incorrect is replaced with testcase fail.
- Finally return the output of the code.
*/




exports.evaluate = async (req,res) => {
    const {examID} = req.params;
    const exam = await Exam.findOne({id:examID});
    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID);

    for( const comp of user.completion) {
        if( comp == examID) {
            return res.json({status:"Already taken this exam"});
        }
    }

    const {questions} = req.body;
    console.log(questions);
    var result;
    var examResult;
    if(exam.exam == "MCQ"){
        result = await MCQ.evalute(examID,questions);
        examResult = {
            examID: examID,
            answers: result.answered,
            score: result.score,
    	    answer: result.answer
}
        await Student.findOneAndUpdate({_id:userID},{
            $push: {completion: parseInt(examID)}
        },{new:true});
    
        await Student.findOneAndUpdate({_id:userID},{
            $push: {exams:examResult},
            $inc: {OAScore: result.score}
        },{new:true}).then(() => {return res.json({examResult}) })
        .catch((err) => {return res.json({status: "Something went wrong"})})
    
    }
    else {

        for( const comp of user.codeExam) {
            if( comp.examID == examID && comp.number == questions.number) {
                return res.json({status:"Already taken this exam"});
            }
        }
        const {result,testcase} = await Code.evaluate(examID, questions, userID);
        for( const resu of result ) {
            if(resu.status == 'incorrect') {
                return res.json(
                    {
                        status:'incorrect',
                        input:resu.input,
                        output: resu.output,
                    }
                )
            }
            if(resu.status == 'Compilation Error') {
                return res.json({
                    status:"Compilation Error",
                    input: resu.input,
                    output: resu.error,
                })
            }
        }
        for( const resus of testcase ) {
	  for(const resu of resus) {
            if(resu.status === 'testcase fail' || resu.status === 'Compilation Error') {
                return res.json({testcase:testcase[0]})
            }
          }
        }
/*
        for( const resu of testcase ) {
	   if(resu.status === 'testcase fail') {
		var testcaseResult = new JSON.constructor();
                let iter = 0;
		console.log(resu);
                for(iter;iter<resu.number;iter++) {
                    testcaseResult[iter] = "success"
                }
                testcaseResult[resu.number] = "failed"
		let ki = resu.number+1;
		for(let ji = ki;ji<resu.total;ji++)
			testcaseResult[ji] = "pending"
                return res.json(
                    {
                        status:'testcase fail',
                        input:resu.input,
                        output: resu.output,
                        testcase:testcaseResult,
                    }
                )
	    }
            if(resu.status == 'Compilation Error') {
                return res.json({
                    status:"Compilation Error",
                    input: resu.input,
                    output: resu.error,
                })
            }
        }
*/
        const successResult = {
            status:'correct',
            input: result[0].input,
            output: result[0].output,
	    testcase: testcase[0]
        }

        const score = (await CodeDB.findOne({examID:examID})).rating;
        const compl = {
            examID: examID,
            number: questions.number
        }

	return res.json(successResult);

    }
}

/*
Submit the question.
- Identify the user detail with the token, which have the user id.
- If Not the coding question.
- Return the score and correct answered question number.
- Otherwise get the question detail from the coding collection with examID and question number.
- Store the input array of the question on the variable.
- Pass each input value and coding in corresponding execution function such as python, c, cpp and java.
- The return data have the status, if status is Compilation error, return it.
- If correct status, return correct. Or incorrect, then return incorrect. 
- This last step is common for all programming language.
- The Same input array function is repeated for testcase array. But incorrect is replaced with testcase fail.
- Finally update on the database, that user submitted the question and also return the output of the code.
*/
exports.submit = async (req,res) => {
    const {examID} = req.params;
    const exam = await Exam.findOne({id:examID});
    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID);

    for( const comp of user.completion) {
        if( comp == examID) {
            return res.json({status:"Already taken this exam"});
        }
    }

    const {questions, takenTime} = req.body;
    var result;
    var examResult;
    if(exam.exam == "MCQ"){
        result = await MCQ.evalute(examID,questions);
        examResult = {
            examID: examID,
            answers: result.answered,
            score: result.score,
	    wrong: result.wrong,
        }
        await Student.findOneAndUpdate({_id:userID},{
            $push: {completion: parseInt(examID)}
        },{new:true});

        await Student.findOneAndUpdate({_id:userID},{
            $push: {exams:examResult},
            $inc: {OAScore: result.score}
        },{new:true}).then(() => {return res.json({examResult}) })
        .catch((err) => {return res.json({status: "Something went wrong"})})

    }
    else {

        for( const comp of user.codeExam) {
            if( comp.examID == examID && comp.number == questions.number) {
                return res.json({status:"Already taken this exam"});
            }
        }
        const {result,testcase} = await Code.evaluate(examID, questions, userID);
	console.log(result,testcase);
        for( const resu of result ) {
            if(resu.status == 'incorrect') {
                return res.json(
                    {
                        status:'incorrect',
                        input:resu.input,
                        output: resu.output,
                    }
                )
            }
            if(resu.status == 'Compilation Error') {
                return res.json({
                    status:"Compilation Error",
                    input: resu.input,
                    output: resu.error,
                })
            }
        }

        for( const resus of testcase ) {
          for(const resu of resus) {
            if(resu.status === 'testcase fail' || resu.status === 'Compilation Error') {
                return res.json({testcase:testcase[0]})
            }
          }
        }

/*
        for( const resu of testcase ) {
            if(resu.status == 'testcase fail') {
                var testcaseResult = new JSON.constructor();
                let iter = 0;
                for(iter;iter<resu.number;iter++) {
                    testcaseResult[iter] = "sucess"
                }
                testcaseResult[resu.number] = "failed"
		let ki = resu.number+1;
                for(let ji = ki;ji<resu.total;j++)
                        testcaseResult[ji] = "pending"
                return res.json(
                    {
                        status:'testcase fail',
                        input:resu.input,
                        output: resu.output,
                        testcase:testcaseResult
                    }
                )
            }
            if(resu.status == 'Compilation Error') {
                return res.json({
                    status:"Compilation Error",
                    input: resu.input,
                    output: resu.error,
                })
            }
        }
*/

        const successResult = {
            status:'correct',
            input: result[0].input,
            output: result[0].output,
	    testcase:testcase[0]
        }

        const score = (await CodeDB.findOne({examID:examID})).rating;
        const compl = {
            examID: examID,
            number: questions.number
        }
        await CodeDB.findOneAndUpdate({ examID: examID, number: questions.number }, { $inc: { submission: 1 } }).then(()=>console.log("User qn updated"));
        await Student.findOneAndUpdate({_id:userID},{
            $push: {codeExam: compl, examTiming: {examID:examID, takenTime:takenTime}},
            $inc: {OAScore: score}
        },{new:true}).then(()=> {return res.json({status:"Submitted",output:successResult})})
        .catch((err) => {return res.json({status: "Something went wrong"})})

    }



}

/*
Result
------

- Return the score of the specific exam
- Only for mcq questions based exam.

*/
exports.result = async (req,res) => {
	const {examID} = req.params;
	const exam = await Exam.findOne({id:examID})
	const userID = await profileID(req.headers.authorization);
	const user = await profile(userID);

	const exams = user.exams;
	for(const ex of exams) {
		if(ex.examID == examID) {
			return res.json({title:exam.title,date:formatDateWithMonthAndTime(exam.date).split(',')[0],start: formatDateTime(exam.start), end: formatDateTime(exam.end),score:ex.score,answer:ex.answers,examID})
		}
	}
	return res.json({status:"Not written yet"});
}

/*
Result
------

- Return the score of the specific exam
- Only for coding questions based exam.

*/
exports.resultCode = async (req,res) => {
    const {examID, number} = req.params;
	const exam = await Exam.findOne({id:examID})
	const userID = await profileID(req.headers.authorization);
	const user = await profile(userID);

    const question = await CodeDB.findOne({examID:examID, number:number})

	const exams = user.codeExam;
	for(const ex of exams) {
		if(ex.examID == examID && ex.number == number) {
			return res.json({title:exam.title,
                date:formatDateWithMonthAndTime(exam.date).split(',')[0],
                start: formatDateTime(exam.start), 
                end: formatDateTime(exam.end),
                score:question.rating,
                answer:ex.answers,
                examID:examID})
		}
	}
	return res.json({status:"Not written yet"});
}


/*
Exit the coding page, when the user time is out.
*/
exports.timeout = async(req,res) => {
	const {examID} = req.params;
	const userid = await profileID(req.headers.authorization);
	const user = await profile(userid);
	const exam = await Exam.findOne({id:examID});
	const loginAct = await Activity.findOneAndDelete({user_id:userid._id});
	if(exam.exam=="MCQ") {
        await Student.findOneAndUpdate({_id:userid},{
            $push: {completion: parseInt(examID)}
        },{new:true}).then(() => {return res.json({status:"Timeout"})});
	}
	else {
		const questions = await CodeDB.find({examID:examID});
		var number = new Array();
		console.log(questions);
		for(const i of questions) {
			const compl = {
				examID: examID,
				number: i,
			}
		        await Student.findOneAndUpdate({_id:userID},{
            			$push: {codeExam: compl},
            			$inc: {OAScore: score}
        		},{new:true}).then(()=> {console.log()})
		}
		return res.json({status:"timeout"});
	}
}
