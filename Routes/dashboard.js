const Meet = require("../Schema/meeting");
const SuperAdmin = require("../Schema/superadmin")
const User = require("../Schema/user")
const Student = require('../Schema/user');
const Admin = require("../Schema/admin")
const College = require("../Schema/college")
const Department = require("../Schema/department")
const jwt = require("jsonwebtoken")
const secret = process.env.secret || "SuperK3y"
const Exam = require("../Schema/events")
const Section = require("../Schema/sections")
const Performance = require("../Schema/performance")
const Rank = require("../Schema/ranking")
const ScoreBoard = require("../Schema/scoreboard")
const Scoring = require("../Schema/scores")
const Event = require("../Schema/techevent")

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


exports.student = async (req, res) => {
    try {
        const person = await profileID(req);

        // Fetch the student's details along with the populated college and department
        const student = await User.findOne({ _id: person._id }).populate('college').populate('department');

        if (!student) {
            return res.json({ error: "Student not found" });
        }

        // Destructure the college and department from the fetched student
        const { college, department } = student;

        // Calculate the performance metrics
        const performance = await Performance.find({ studentid: student._id });
        const numberOfExams = performance.length;
        let numberOfSection = 0;
        const numberOfMcq = await Performance.find({ studentid: student._id, category: 'mcq' }).count();
        const numberOfCod = await Performance.find({ studentid: student._id, category: "coding" }).count();
        const numberOfBot = await Performance.find({ studentid: student._id, category: "both" }).count();

        let overallpoint = 0;
        let point = 0;
        const OverAllPerf = [];

        for (let perf of performance) {
            const allSection = [];
            const studentPerf = [];
            point += perf.obtainpoint;
            numberOfSection += perf.sections.length;
            const exam = await Exam.findOne({ _id: perf.examid });

            if (!exam) {
                console.error(`Exam not found for exam ID: ${perf.examid}`);
                continue;
            }

            overallpoint += exam.overallRating;

            for (let score of exam.sections) {
                const section = await Section.findOne({ _id: score }, { questions: 0 });
                const studentScore = await Scoring.findOne({ sectionid: score });
                studentPerf.push(studentScore);
                allSection.push(section);
            }

            OverAllPerf.push({
                exam: exam,
                section: allSection,
                scores: studentPerf
            });
        }

        // Fetch the scoreboard for the particular student
        const scoreboard = await ScoreBoard.find({ studentid: student._id });

        // Fetch the ranking details for the particular student
        const ranking = await Rank.findOne({ studentid: student._id });

        // Return the response with all gathered details
        return res.json({
            user: student.name,
            college: college ? college.college : "Not found",
            department: department ? department.department : "Not found",
            year: department ? department.year : "Not found",
            semester: department ? department.semester : "Not found",
            section: department ? department.section : "Not found",
            mcq: numberOfMcq,
            coding: numberOfCod,
            both: numberOfBot,
            overallpoint: overallpoint,
            point: point,
            graph: OverAllPerf,
            scoreboard: scoreboard,
            ranking: ranking
        });
    } catch (e) {
        console.error('Error fetching student details:', e);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


exports.studentDetail = async (req, res) => {
    const { userID } = req.params;
    try {
        // Fetch the user details
        const person = await User.findOne({ _id: userID });

        if (!person) {
            return res.status(404).json({ status: "User not found" });
        }

        // Fetch the college details
        const college = await College.findOne({ _id: person.college });
        if (!college) {
            return res.status(404).json({ status: "College not found" });
        }

        // Fetch the department details
        const department = await Department.findOne({ _id: person.department });
        if (!department) {
            return res.status(404).json({ status: "Department not found" });
        }

        // Fetch the performance details
        const performance = await Performance.find({ studentid: person._id });
        const numberOfExams = performance.length;
        
        // Calculate different performance categories
        const numberOfMcq = await Performance.countDocuments({ studentid: person._id, category: 'mcq' });
        const numberOfCod = await Performance.countDocuments({ studentid: person._id, category: "coding" });
        const numberOfBot = await Performance.countDocuments({ studentid: person._id, category: "both" });

        // Variables to hold the cumulative scores and sections
        let overallpoint = 0;
        let point = 0;
        let numberOfSection = 0;
        const OverAllPerf = [];

        // Process each performance record
        for (let perf of performance) {
            const allSection = [];
            const studentPerf = [];
            point += perf.obtainpoint;
            numberOfSection += (perf.sections).length;

            const exam = await Exam.findOne({ _id: perf.examid });
            if (!exam) {
                console.error(`Exam not found for exam ID: ${perf.examid}`);
                continue;
            }

            overallpoint += exam.overallRating;

            for (let score of exam.sections) {
                const section = await Section.findOne({ _id: score }, { questions: 0 });
                const studentScore = await Scoring.findOne({ sectionid: score });
                studentPerf.push(studentScore);
                allSection.push(section);
            }

            OverAllPerf.push({
                exam: exam,
                section: allSection,
                scores: studentPerf
            });
        }

        // Fetch the scoreboard and ranking details
        const scoreboard = await ScoreBoard.find({ department: person.department }, { exams: 0, department: 0, college: 0 }).limit(5);
        const ranking = await Rank.findOne({ studentid: person._id }, { college: 0, department: 0 });

        // Return the response with all gathered details
        return res.json({
            user: person.name,
            college: college.college,
            department: department.department,
            year: department.year,
            semester: department.semester,
            section: department.section,
            mcq: numberOfMcq,
            coding: numberOfCod,
            both: numberOfBot,
            overallpoint: overallpoint,
            point: point,
            graph: OverAllPerf,
            scoreboard: scoreboard,
            ranking: ranking
        });
    } catch (e) {
        console.error('Error fetching student details:', e);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


exports.admin = async (req, res) => {
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

        // Fetch the exams, events, and scoreboard entries
        const exam =  await Exam.find({end: {$gt: new Date().getTime()}});
        const event = await Event.find({}).limit(5);
        const scoreEntries = await ScoreBoard.find({}).sort({ scores: -1 });

        // Combine the exams in the scoreboard
        const combineExams = scores => {
            const combined = {};
            scores.forEach(score => {
                score.exams.forEach(exam => {
                    if (!combined[exam.examid]) {
                        combined[exam.examid] = {
                            examid: exam.examid,
                            examtitle: exam.examTitle,
                            examStartDate: exam.examStartDate,
                            sections: []
                        };
                    }
                    combined[exam.examid].sections.push({
                        sectionID: exam.sectionID,
                        category: exam.category,
                        overall: exam.overall,
                        obtain: exam.obtain,
                    });
                });
            });
            return Object.values(combined);
        };

        const combinedScoreboard = combineExams(scoreEntries);

        // Combine the fetched data into a single response
        return res.json({
            score: studentDetailsList,
            exams: exam,
            events: event,
            scoreboard: combinedScoreboard
        });
    } catch (error) {
        console.error('Error fetching admin details:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};




exports.superadmin = async(req,res) => {
    const user = await profileID(req);

    const exam =  await Exam.find({end: {$gt: new Date().getTime()}, college:user.college}).limit(5);
    const event = await Event.find({}).limit(5);
    const score = await ScoreBoard.find({college:user.college}).sort({scores:-1}).limit(5)
    return res.json({exam:exam,event:event,scoreboard:score});
}
