const mongoose = require("mongoose")
const Event = require("../Schema/events")
const MCQ = require("./mcqs")
const Code = require("./CodingQN")
const Department = require("../Schema/department");
const College = require("../Schema/college")
const Student = require("../Schema/user")
const CodeDB = require("../Schema/programming");
const Section = require("../Schema/sections")
const Performance = require("../Schema/performance")
const secret = process.env.secret;
const User = require('../Schema/user');
// Websocket api
exports.listout = async () => {
    var exams = await Event.find({},{questions:0})
    return exams;
}

/*
Time Calculation, Formatting and Student Score
----------------------------------------------

- Used to identify the status of the exam like ended, upcoming and ongoing.
- Format the date, which is in timestap format.
- Format the timestap to date with month and time.
*/
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

async function scoreof(examID, students) {
    const studentDetail = new Array();
    for(let student of students) {
        const performance = await Performance.findOne({examid:examID,studentid:student})
        if(!performance) {
            studentDetail.push({
                _id: student._id,
                name: student.name,
                rollno:student.rollno,
                username:student.username,
                obtainpoint: 0,
            })
        }
        else {
            studentDetail.push({
                _id: student._id,
                name: student.name,
                rollno:student.rollno,
                username:student.username,
                obtainpoint: performance.obtainpoint,
            })
        }
    }
    return studentDetail;
}

/*
- Listout the exams allocated for the specific department of the students.
- Both mcq and coding exams.
*/
exports.dashboard = async (req,res) => {
    var exams = await Event.find({},{questions:0})
    var examList = [];

    for (const exam of exams) {
        const departmentData = await Department.findOne({_id:exam.department})
        const college = await College.findOne({_id:exam.college});

        if(!departmentData && !college)
            continue;

        const json = {
            _id: exam.id,
            title: exam.title,
            college: college.college,
            department: departmentData.department,
            year: departmentData.year,
            semester: departmentData.semester,
            section: departmentData.section,
            date: formatDateWithMonthAndTime(exam.date).split(',')[0],
            start: exam.start,
            end: exam.end,
            id: exam.id,
            category: exam.exam,
	        status: getTimeStatus(exam.start,exam.end),
        }

        examList.push(json)
    }

    return res.json({exams:examList})
}

/*
- Listout the exams allocated for the all the departments.
- Both mcq and coding exams.
*/
exports.adminDashboard = async (req,res) => {
	var exams = await  Event.find({});
	var examList = [];
    for (const exam of exams) {
        const departmentData = await Department.findOne({_id:exam.department})
        const college = await College.findOne({_id:exam.college});
        if(!departmentData || !college)
            continue;
        const json = {
            _id: exam.id,
            title: exam.title,
            college: college.college,
            department: departmentData.department,
            year: departmentData.year,
            semester: departmentData.semester,
            section: departmentData.section,
            date: formatDateWithMonthAndTime(exam.date).split(',')[0],
            start: formatDateTime(exam.start),
            end: formatDateTime(exam.end),
            category: exam.category,
            duation: exam.duration,
            sections: (exam.sections).length,
            status: getTimeStatus(exam.start,exam.end),
        }
        examList.push(json)
    }
    return res.json({exams:examList})

}


/*
Admin Panel Access.
-------------------

- Create a new exams
- Generate a unique ID for exam.
- Also the call the mcq or coding function to save the question in corresponding database.
*/
exports.new = async (req,res) => {
    const { title,category, date, start,end,college, department,year, sections} = req.body;
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
    var newExam = await Event({
        title: title,
        category: category,
        date: date,
        start: start,
        end: end,
        duration: overDuration,
        sections: sectionsID.map((section) => section._id),
        department:department.map((department) => department),
        year:year,
        college: college,
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
[ Not in use ]
*/
exports.upload = async (req,res) => {
	console.log(req);
    const { title, date, start,college, department, end, exam} = req.body;
	console.log(req.file);
	if(!req.file)
		return res.json({status:"No file upload"});

	const file = req.file;
	const filename = file.originalname;
	const filePath = file.path;
	const workbook = xlsx.readFile(filePath);
	const worksheet = workbook.Sheets[workbook.SheetNames[0]];
	const data = xlsx.utils.sheet_to_json(worksheet);

	var questions = new Array();

for (const row of data) {
  // Delete the row if undefined
  for (const key in row) {
    if (row[key] === undefined) {
      row[key] = ''; // replace undefined with null
    }
  }

  if(exam==="MCQ") {
  const json = {
    number: row.number,
    question: row.question,
    answer: row.answer,
    options: new Array(row.optiona, row.optionb, row.optionc, row.optiond),
    rating: row.rating,
  };
 }
 else {
	const json = {
		title: row.title,
  number: row.number,
  description: row.description,
  inputDescription: row.inputDescription,
  outputDescription: row.outputDescription,
  io: [
    {
      input: row.input,
      output: row.output,
      descryption:row.descryption
    }
  ],
  testcase: [
	{
		input: row.tinput,
		output: row.toutput,
        descryption:row.descryption
	}
],
  rating: row.rating
	}

 }
  questions.push(json);
}


	// Generate exam id
    var examID = await new Date().getTime();
    var newExam = await Event({
        id: examID,
        title: title,
        exam: exam,
        college: college,
        department: department,
        date: date,
        start: start,
        end: end,
    });

    // Save the test
    newExam.save()
    .then( (newEvt) => {
        if(exam == "MCQ") 
            var result = MCQ.add(questions,examID);
        else if ( exam == "Coding")
            var result = Code.add(questions,examID)
        if(result != 1)
            res.json({response:"New Test are added."})
    })
    .catch((err) => res.json({response:`Something wrong.\nBacktrack\n${err}`}))
}

/*
- Get the exam deatils
- Student panel access.
- Also get the coding question of the corresponding type such as mcq and coding.
*/
exports.examof = async (req,res) => {
    const {examID} = req.params;

    const exam = await Event.findOne({_id:examID});
    const question = await Promise.all(
        (exam.sections).map(async (section) => {
            const sec = await Section.findOne({_id:section});
            return sec;
        })
    )
    const college = await College.findOne({_id:exam.college});
    const department = await Department.findOne({_id:exam.department})

    const students = await Student.find({ college: exam.college, department: exam.department }, { __v: 0,department:0,college:0, username: 0, password: 0, role: 0,image:0 }).sort({ name: 'asc' });
    const student = await scoreof(examID, students);

    return res.json({
        title:exam.title,
        college: college.college,
        department: department.department,
        year: department.year,
        semester: department.semester,
        section: department.section,
        date: formatDateWithMonthAndTime(exam.date).split(',')[0],
        start: formatDateTime(exam.start),
        end: formatDateTime(exam.end),
        status:getTimeStatus(exam.start,exam.end),
	    category: exam.exam,
        students: student,
        sections: question,
        point: exam.overallRating
    });
}
/* 
- Get the exam detail
- Not the question
- Just the start, time and type of exam.
*/
exports.examDetail = async (req, res) => {
    try {
        const { examID } = req.params;
        const exam = await Event.findOne({ _id: examID });

        if (!exam) {
            return res.status(404).json({ error: 'Exam not found' });
        }

        const college = await College.findOne({ _id: exam.college });

        if (!college) {
            return res.status(404).json({ error: 'College not found' });
        }

        if (!Array.isArray(exam.department) || exam.department.length === 0) {
            return res.status(404).json({ error: 'Departments not found' });
        }

        const departments = await Department.find({ _id: { $in: exam.department } });

        if (!departments.length) {
            return res.status(404).json({ error: 'No departments found' });
        }

        console.log('Fetched Departments:', departments);

        const studentPromises = departments.map(async (department) => {
            console.log(`Fetching students for department ID: ${department._id} and college ID: ${exam.college}`);

            // Detailed logging before query
            console.log(`Querying User collection with college ID: ${exam.college} and department ID: ${department._id}`);

            const students = await User.find(
                { college: exam.college, department: department._id },
                { __v: 0, department: 0, college: 0, username: 0, password: 0, role: 0, image: 0 }
            ).sort({ name: 'asc' });

            console.log(`Students for department ${department._id}:`, students);

            if (students.length === 0) {
                console.warn(`No students found for department ID: ${department._id} and college ID: ${exam.college}`);
            }

            return scoreof(examID, students);
        });

        const students = await Promise.all(studentPromises);

        console.log('Students:', students);

        return res.json({
            title: exam.title,
            college: college.college,
            department: departments.map(department => ({
                _id: department._id,
                college: department.college,
                department: department.department,
                year: department.year,
                semester: department.semester,
                section: department.section,
                __v: department.__v
            })),
            date: formatDateWithMonthAndTime(exam.date).split(',')[0],
            start: formatDateTime(exam.start),
            end: formatDateTime(exam.end),
            status: getTimeStatus(exam.start, exam.end),
            category: exam.exam,
            students: students.flat(),
            point: exam.overallRating
        });
    } catch (error) {
        console.error('Error fetching exam details:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

/*
Evaluate The mcq question
- Not the coding question.
- Return the score and correct answered question number.
*/
exports.evaluateMCQ = async (req,res) => {

    // Get the parameter values.
    const {examID, questions} = req.body;

    // Get the token
    const header = req.headers.authorization;
    const token = header.substring(7);

    // Get the user details.
    var creds = jwt.verify(token,secret);

    // Evaluate the questions.
    const response = MCQ.evalute(examID,questions);
    
    // Updated the exam data
    const result = {
        examID: examID,
        answers: response.answered,
        score: response.score,
    }

    await Student.findOneAndUpdate({username:creds.username,rollno:creds.rollno},
        {
            $push:{exams:result},
            $inc: {OAScore: response.score}
        },
        {new: true}
    ).then((data) => { return result})
    .catch((err) => { return "Something went wrong at find the student."});
}