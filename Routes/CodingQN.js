const mongoose = require('mongoose');
const jwt = require("jsonwebtoken")
const Student = require('../Schema/user')
const {exec} = require("child_process")
const fs = require("fs").promises;
const Training = require("../Schema/training")

// Execution files
const Python = require("./python");
const C = require("./c")
const Java = require("./java")

/*
Not in use
Add a new question
- Create a new question for the particular department of the college.
- Create a question set for coding part exam.
- With the unique EXAMID.
- Database Collection name is exams.
*/
exports.add = async (questions, id) => {
    questions.forEach(async element => {
        const qn = await Program({
            examID: id,
            title: element.title,
            description: element.description,
            number: element.number,
            rating: element.rating,
            inputDescription: element.inputDescription,
            outputDescription: element.outputDescription,
            io: element.io,
            testcase: element.testcase,
            testcaseDescription: element.testcaseDescription,
            submission: 0
        });
        qn.save()
        .then((data) => console.log(`${element.number} is added`))
        .catch((err) => console.log(`Can't add ${element.number} question`));
    
    });
} 
/*
Not in use
- Get all the coding questions, which were created by the admin.
- Return all the questions to the function.
*/
exports.displayAdmin = async() => {
	const questions = await Program.find({});
	return questions;
}
/*
Old feature
- Get the coding questions of the specify examID, which were created by the admin.
- Return all the questions to the function.
*/
exports.display = async (examID,user) => {
    var compl;
    const questions = await Program.find({examID:examID},{_id:0,__v:0});
    return questions;
}


/*
- Get all the coding questions except the attended number, which were created by the admin.
- Return all the questions to the function.
- [ Not in use ].
*/
exports.displayRemain = async(examID,compl)=> {
    const questions = await Program.find({examID:examID});
    var remain = new Array();
    for(const fin of compl) {
	for(const qn of questions) {
		if((fin.number !== qn.number) && ( fin.examCode !== qn.examCode)) 
			remain.push(qn);
	}
    }
    return remain;
};

/*
- Get the coding questions of the specific examID, which were created by the admin.
- Return all the questions to the function.
*/
exports.displayStudent = async(examID,number ) => {
    const questions = await Program.findOne({examID:examID, number: number},{testcase:0});
    return questions;
}

/*
- [ Not in use ].
- Get the specific question on the coding collection.
- Old Code, this function is not in use . 
*/
exports.get = async (req,res) => {
    const { questionID } = req.body;
    const qn = await Program.findOne({number: questionID},{_id:0, __v:0});
    if(!qn) {
        return res.json({response:"null"});
    }

    const ResponseJson = { 
        title: qn.title,
        description: qn.description,
        questionID: qn.number,
        input: qn.input,
        output: qn.output,
        rating: qn.rating
    }

    res.json(ResponseJson);
}

/*
Evaluate the coding question.
- Identify the user detail with the token, which have the user id.
- This function is used for both training and coding question, it depend on examID.
- Get the question detail from the coding collection with examID and question number.
- Store the input array of the question on the variable.
- Pass each input value and coding in corresponding execution function such as python, c, cpp and java.
- The return data have the status, if status is Compilation error, return it.
- If correct status, return correct. Or incorrect, then return incorrect. 
- This last step is common for all programming language.
- The Same input array function is repeated for testcase array. But incorrect is replaced with testcase fail.
- Finally return the output of the code.
*/
exports.evaluate = async (examID, questions,question, userID,show) => {
    const user = await Student.findOne({ _id: userID });
    const io = question.output;
    var i = 0;
    const testCases = io.map(async (ioiter) => {
        var input = ioiter.input;
        const output = ioiter.output;
        if(input == '')
            input = [''];
        else if(typeof(input) === "string" || typeof(input) === "number") 
            input = [input]
        if(questions.language === 'python') {
                const codeOutput = await Python.python(userID, examID, questions,i++, input);
                if (codeOutput == output) {
                    return {
                        status: 'correct',
                        input: input,
                        output: codeOutput,
                        expect: output,
                        rating: ioiter.rating
                    };
                } 
                else if(codeOutput.status === "Compilation error") {
                    return {
                        status: "Compilation Error",
                        input: input,
                        error: codeOutput.error,
                    }
                }
                else {
                    return {
                        status: 'incorrect',
                        input: input,
                        output: codeOutput,
                        expect: output,
                        rating: ioiter.rating
                    };
                }
            }
            else if (questions.language === 'c') {
                const codeOutput = await C.c(userID, examID, questions,i++, input);
                if (codeOutput == output) {
                    return {
                        status: 'correct',
                        input: input,
                        output: codeOutput,
                        expect: output,
                        rating: ioiter.rating
                    };
                }
                else if(codeOutput.status === "Compilation error") {
                    return {
                        status: "Compilation Error",
                        input: input,
                        error: codeOutput.error,
                    }
                } 
                else {
                    return {
                        status: 'incorrect',
                        input: input,
                        output: codeOutput,
                        expect: output,
                        rating: ioiter.rating
                    };
                }
            }
            else if(questions.language === 'c++'){
                const codeOutput = await C.cpp(userID, examID, questions,i++, input);
                console.log(codeOutput);
            if (codeOutput == output) {
                    return {
                        status: 'correct',
                        input: input,
                        output: codeOutput,
                        expect: output,
                        rating: ioiter.rating
                    };
                } 
                else if(codeOutput.status === "Compilation error") {
                    return {
                        status: "Compilation Error",
                        input: input,
                        error: codeOutput.error,
                    }
                }
                else {
                    return {
                        status: 'incorrect',
                        input: input,
                        output: codeOutput,
                        expect: output,
                        rating: ioiter.rating
                    };
                }
            }
            else if(questions.language === 'java'){
                const codeOutput = await Java.java(userID, examID, questions,i++, input);
                if (codeOutput == output) {
                    return {
                        status: 'correct',
                        input: input,
                        output: codeOutput,
                        expect: output,
                        rating: ioiter.rating
                    };
                } 
                else if(codeOutput.status === "Compilation error") {
                    return {
                        status: "Compilation Error",
                        input: input,
                        error: codeOutput.error,
                    }
                }
                else {
                    return {
                        status: 'incorrect',
                        input: input,
                        output: codeOutput,
                        expect: output,
                        rating: ioiter.rating
                    };
                }            
            }
    });

    var j = 0;
    
    const RealtestCases = (question.testcase).map(async (ioiter,number) => {
        let questionno = number
        var input = ioiter.input;
        var output = ioiter.output;
        if(input == '')
            input = [''];
        else if(typeof(input) === "string" || typeof(input) === "number") 
            input = [input]
        var testcaseOutput = new Array();
        if(questions.language === 'python') {
            const codeOutput = await Python.python(userID, examID, questions,i++, input);
            if (codeOutput == output) {
                testcaseOutput.push({
                    status: 'correct',
                    number: questionno,
	                input: input,
                    output: codeOutput,
                    expect: output,
                    rating: ioiter.rating
                });
            } 
            else if(codeOutput.status === "Compilation error") {
                testcaseOutput.push({
                    status: "Compilation Error",
                    input: input,
                    number: questionno,
                    error: codeOutput.error,
                })
            }
            else {
                testcaseOutput.push({
                    status: 'testcase fail',
                    input: input,
                    number: questionno,
                    output: codeOutput,
                    expect: output,
                    rating: ioiter.rating
                });
            }
        }
        else if (questions.language === 'c') {
            const codeOutput = await C.c(userID, examID, questions,i++, input);
            if (codeOutput == output) {
                testcaseOutput.push({
                    status: 'correct',
                    input: input,
                    number: questionno,
                    output: codeOutput,
                    expect: output,
                    rating: ioiter.rating
                });
            }
            else if(codeOutput.status === "Compilation error") {
                testcaseOutput.push({
                    status: "Compilation Error",
                    input: input,
                    number: questionno,
                    error: codeOutput.error,
                })
            } 
            else {
                testcaseOutput.push({
                    status: 'testcase fail',
                    input: input,
                    number: questionno,
                    output: codeOutput,
                    expect: output,
                    rating: ioiter.rating
                });
            }
        }
        else if(questions.language === 'cpp'){
            const codeOutput = await C.cpp(userID, examID, questions,i++, input);
            if (codeOutput == output) {
                testcaseOutput.push({
                    status: 'correct',
                    input: input,
                    number: questionno,
                    output: codeOutput,
                    expect: output,
                    rating: ioiter.rating
                });
            } 
            else if(codeOutput.status === "Compilation error") {
                testcaseOutput.push({
                    status: "Compilation Error",
                    input: input,
                    number: questionno,
                    error: codeOutput.error,
                    expect: output,
                    rating: ioiter.rating
                })
            }
            else {
                testcaseOutput.push({
                    status: 'testcase fail',
                    input: input,
                    number: questionno,
                    output: codeOutput,
                    expect: output,
                    rating: ioiter.rating
                });
            }            
        }
        else if(questions.language === 'java'){
            const codeOutput = await Java.java(userID, examID, questions,i++, input);
            if (codeOutput == output) {
                testcaseOutput.push({
                    status: 'correct',
                    input: input,
                    number: questionno,
                    output: codeOutput,
                    expect: output,
                    rating: ioiter.rating
                });
            } 
            else if(codeOutput.status === "Compilation error") {
                testcaseOutput.push({
                    status: "Compilation Error",
                    input: input,
                    number: questionno,
                    error: codeOutput.error,
                    
                })
            }
            else {
                testcaseOutput.push({
                    status: 'testcase fail',
                    input: input,
                    number: questionno,
                    output: codeOutput,
                    expect: output,
                    rating: ioiter.rating
                });
            }            
        }
	    questionno++;
    return testcaseOutput;
    });

    var result = await Promise.all(testCases);
    var testcase = await Promise.all(RealtestCases);
    return {result,testcase};
};
