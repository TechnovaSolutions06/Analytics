const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose');
const User = require('../Schema/user');
const Department = require('../Schema/department');
const ScoreBoard = require('../Schema/scoreboard');
const Rank = require('../Schema/ranking');
const Event = require('../Schema/events');
const Performance =require('../Schema/performance');

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


exports.score = async (req, res) => {
    const { studentid } = req.params;
    try {
        const person = await User.findOne({ _id: studentid });

        if (!person) {
            return res.status(404).json({ status: "User not found" });
        }

        const department = await Department.findOne({ _id: person.department });
        if (!department) {
            return res.status(404).json({ status: "Department not found" });
        }

        // Find scoreboard entries for the specific student
        const studentScores = await ScoreBoard.find({ studentid: person._id });

        // Find top scoreboard entries for the department
        const departmentScores = await ScoreBoard.find({ department: person.department });

        const ranking = await Rank.findOne({ studentid: person._id });
        const exam = await Event.findOne({ department: person.department });
        const examStartDate = exam ? exam.start : null;
        const examTitle = await Event.findOne({ department: person.title });

        // Combine exam entries with the same exam ID
        const combineExams = scores => {
            const combined = {};
            scores.forEach(score => {
                score.exams.forEach(exam => {
                    if (!combined[exam.examid]) {
                        combined[exam.examid] = {
                            examid: exam.examid,
                            examtitle:examTitle,
                            examStartDate: examStartDate,
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

        const combinedStudentScores = combineExams(studentScores);
        const combinedDepartmentScores = combineExams(departmentScores);

        return res.json({
            user: person.name,
            department: department.department,
            studentScores: combinedStudentScores,
            departmentScores: combinedDepartmentScores,
            ranking: ranking,
            
        });
    } catch (e) {
        console.error('Error fetching scoreboard details:', e);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.adminscore = async (req, res) => {
    const { studentid } = req.params;
    try {
        // Decode the token and extract user information
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.decode(token);
     // Ensure user has admin or superadmin role
        if (decodedToken.role !== 'admin' && decodedToken.role !== 'superadmin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Find user details based on the studentid
        const person = await User.findOne({ _id: studentid });
        if (!person) {
            return res.status(404).json({ status: "User not found" });
        }

        // Find scoreboard entries for the specific student
        const studentScores = await ScoreBoard.find({ studentid: person._id }).sort({ scores: -1 });

        // Find top scoreboard entries for the department
        const departmentScores = await ScoreBoard.find({ department: person.department }).sort({ scores: -1 });

        const ranking = await Rank.findOne({ studentid: person._id });
        // Fetch exam start date
        const exam = await Event.findOne({ department: person.department }).sort({ start: -1 });
        const examStartDate = exam ? exam.start : null;
        const examTitle = exam ? exam.title : null;

        // Combine exam entries with the same exam ID
        const combineExams = scores => {
            const combined = {};
            scores.forEach(score => {
                score.exams.forEach(exam => {
                    if (!combined[exam.examid]) {
                        combined[exam.examid] = {
                            examid: exam.examid,
                            examtitle:examTitle,
                            examStartDate: examStartDate,
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

        const combinedStudentScores = combineExams(studentScores);
        const combinedDepartmentScores = combineExams(departmentScores);

        return res.json({
            user: person.name,
            department: department.department,
            studentScores: combinedStudentScores,
            departmentScores: combinedDepartmentScores,
            ranking: ranking,
        });
    } catch (e) {
        console.error('Error fetching scoreboard details:', e);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
