const mongoose = require('mongoose');
const MCQ = require("../Schema/mcq");
const Test = require("../Schema/events")

async function updateSubmission(number, oldsubmisssion) {
    await MCQ.findOneAndUpdate({number: number},{submission: oldsubmisssion+1})
    .then( (data) => console.log(`Question ${number}'s submission count is incremented`))
    .catch( (err) => console.log(`Can't increment question ${number}`));
}


/*
Add a new question
- Create a new question for the particular department of the college.
- Create a question set for mcq part exam.
- With the unique EXAMID.
- Database Collection name is exams.
*/
exports.add = async (questions, examID) => {

    // Add all the question
    questions.forEach(async (element) => {
        const mcq = await MCQ({
            examID: examID,
            question: element.question, 
            number: element.number, // Start with 1 and increment for every questions
            rating: element.rating,
            answer: element.answer,
            options: element.options,
            submission: 0
        });

        mcq.save()
        .then((data) => console.log(`${element.number} is added`))
        .catch((err) => {
            console.log(`Can't add ${element.number} question`);
            return 1;
        });
    });
} 



/*
- Get all the mcq questions, which were created by the admin.
- Return all the questions to the function.
*/
exports.display = async (examID) => {
    const questions = await MCQ.find({examID:examID},{_id:0,__v:0}).sort({number:'asc'});
    return questions;
}


/*
- Get the mcq questions of the specify examID, which were created by the admin.
- Return all the questions to the function.
*/
exports.displayStudent = async (examID, number) => {
    const questions = await MCQ.find({examID:examID},{_id:0,__v:0, answer:0}).sort({number:'asc'});
    return questions;
}

exports.answer = async(examID) => {
    const questions = await MCQ.find({examID:examID},{question:1,number:1,answer:1}).sort({number:'asc'});
    return questions;
}
/*
Evaluate The mcq question
- Not the coding question.
- Return the score and correct answered question number.
*/
exports.evalute = async (examID,questions) => {

    // Scorepoint
    var score = 0;

    // Correct Answer question number
    var correctQuestion = new Array();
    var wrongQuestion = new Array();
    var answerOption = new Array();
    // Get all the question of examID
    for (const answer of questions) {
        const question = await MCQ.findOne({ examID: examID, number: answer.number });
        if (question.answer == answer.answer) {

          // Add the point for the current correct question.
          score += question.rating;
          answerOption.push(question.answer);
	// Update submission number.
          await MCQ.findOneAndUpdate({ examID: examID, number: answer.number }, { $inc: { submission: 1 } })
            .catch((err) => { console.error("Something went wrong:", err); });
    
          // Update correct question for the return purpose.
          correctQuestion.push(question.number);
        }
	else {
	  wrongQuestion.push(question.number);
	}
      }
    return {score:score,answered:correctQuestion,wrong:wrongQuestion,answer:answerOption};
}

/*
[ Not in use ]
*/
exports.get = async (req,res) => {
    const { questionID } = req.body;
    const qn = await MCQ.findOne({number: questionID},{_id:0, __v:0});
    if(!qn) {
        return res.json({response:"null"});
    }

    const alloptions = new Array();

    const ResponseJson = { 
        question: qn.question,
        number: qn.number,
        rating: qn.rating,
        options: qn.options,
    }

    res.json(ResponseJson);
}




