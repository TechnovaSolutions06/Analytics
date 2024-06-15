const mongoose = require("mongoose");
const Event = require("../Schema/events");
const jwt = require("jsonwebtoken");
const secret = process.env.secret || "SuperK3y";
const MCQ = require("./mcqs");
const Code = require("./CodingQN");
const Department = require("../Schema/department");
const College = require("../Schema/college");
const Student = require("../Schema/user");
const CodeDB = require("../Schema/programming");
const Section = require("../Schema/sections");
const Performance = require("../Schema/performance");
const User = require('../Schema/user'); // Double check if this is needed

// Middleware to check if user is admin
function isAdmin(req, res, next) {
    // Replace with actual admin role checking logic
    const isAdmin = true; // Example: Implement logic to check if user is admin
    
    if (isAdmin) {
        next(); // Proceed to next middleware
    } else {
        res.status(403).json({ message: "Unauthorized" });
    }
}

// Function to retrieve profile ID from token
async function profileID(authHeader) {
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }
    
    try {
        const user = jwt.verify(token, secret);
        return user.id; // Return user ID
    } catch (err) {
        console.error("Error decoding token:", err);
        return null; // Handle token decoding errors gracefully
    }
}

// Middleware export
exports.isAdmin = isAdmin;

// Import PlaygroundDB schema
const PlaygroundDB = require("../Schema/playground");

// Endpoint to post questions (Admin)
exports.postQuestion = async (req, res) => {
    isAdmin(req, res, async () => {
        const { name, question, input, code, language } = req.body;
        const token = req.headers.authorization;
        const userid = await profileID(token);

        const pg = new PlaygroundDB({
            name,
            userid,
            question,
            input,
            code,
            language,
            isAdminQuestion: true,
            examID: null,
            questionID: null
        });

        try {
            const savedQuestion = await pg.save();
            res.json({ id: savedQuestion._id, status: "Saved" });
        } catch (err) {
            console.error("Error saving question:", err);
            res.status(500).json({ status: "Error", error: err.message });
        }
    });
};
// Endpoint to upload coding questions (Admin)
exports.upload = async (req, res) => {
    isAdmin(req, res, async () => {
        const { title, date, start, end, college, department, exam } = req.body;

        if (!req.file) {
            return res.json({ status: "No file uploaded" });
        }

        const file = req.file;
        const workbook = xlsx.readFile(file.path);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(worksheet);

        const questions = data.map(row => {
            // Ensure keys are defined to prevent undefined values
            for (const key in row) {
                if (row[key] === undefined) {
                    row[key] = '';
                }
            }

            return {
                title: row.title,
                number: row.number,
                description: row.description,
                inputDescription: row.inputDescription,
                outputDescription: row.outputDescription,
                io: [{
                    input: row.input,
                    output: row.output,
                    description: row.description
                }],
                testcase: [{
                    input: row.tinput,
                    output: row.toutput,
                    description: row.description
                }],
                rating: row.rating
            };
        });

        const examID = Date.now();
        const newExam = new Event({
            id: examID,
            title,
            exam,
            college,
            department,
            date,
            start,
            end,
        });

        try {
            await newExam.save();
            const result = await Code.add(questions, examID);

            if (result === 1) {
                res.json({ response: "New test has been added." });
            } else {
                res.json({ response: "Something went wrong while adding questions." });
            }
        } catch (err) {
            console.error("Error uploading questions:", err);
            res.json({ response: `Something went wrong.\nBacktrack\n${err.message}` });
        }
    });
};


// Endpoint for students to save their answers
exports.saveAnswer = async (req, res) => {
    const { examID, questionID, answer } = req.body;
    const token = req.headers.authorization;
    const userID = await profileID(token);

    if (!userID) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        const playground = new PlaygroundDB({
            examID,
            questionID,
            userid: userID,
            answer,
        });

        await playground.save();
        res.json({ status: "Answer saved successfully" });
    } catch (err) {
        console.error("Error saving answer:", err);
        res.status(500).json({ status: "Error saving answer", error: err.message });
    }
};

// Endpoint for students to edit their answers
exports.editAnswer = async (req, res) => {
    const { examID, questionID, answer } = req.body;
    const token = req.headers.authorization;
    const userID = await profileID(token);

    if (!userID) {
        return res.status(403).json({ message: "Unauthorized" });
    }

    try {
        const playground = await PlaygroundDB.findOne({ examID, questionID, userid: userID });

        if (!playground) {
            return res.status(404).json({ message: "Answer not found" });
        }

        playground.answer = answer;
        await playground.save();
        res.json({ status: "Answer updated successfully" });
    } catch (err) {
        console.error("Error updating answer:", err);
        res.status(500).json({ status: "Error updating answer", error: err.message });
    }
};
