const mongoose = require("mongoose");
const Training = require("../Schema/training");
const Student = require("../Schema/user");
const Code = require("./CodingQN")
const CodeDB = require("../Schema/programming")

const jwt = require("jsonwebtoken");
const secret = process.env.secret;

async function profileID(authHeader)  {
    var token;
    if( authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }
    try{
        var user = jwt.verify(token,secret);
        return user?.id
    }
    catch{
        return null;
    }
}

async function profile(id) {
    const user = await Student.findOne({_id:id});
    return user;
}

/*
- Listout the training allocated for the department of their students.
*/
exports.training = async(req,res) => {
	const questions = await Training.find({});
	const token = req.headers.authorization;
	const userID = await profileID(token);
	const user = await profile(userID);
	return res.json({
		id: user?._id,
		user: user?.username,
		training: user?.training,
		questions:questions
	});
}

/*
Execute the coding question.
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
exports.evaluate = async (req,res) => {
    const {questions} = req.body;
    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID);

    for( const comp of user?.training) {
        if( comp == questions.id) {
            return res.json({status:"Already taken this exam"});
        }
    }

    var examResult;
    const {result,testcase} = await Code.evaluate(false, questions, userID);

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
        for( const resu of testcase ) {
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

        const successResult = {
            status:'correct',
            input: result[0].input,
            output: result[0].output,
        }

        const score = (await Training.findOne({_id:questions.id})).rating;
        const compl = {
            number: questions.number
        }
    	return res.json(successResult);

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
    const {questions} = req.body;
    const userID = await profileID(req.headers.authorization);
    const user = await profile(userID);

    for( const comp of user?.completion) {
        if( comp == questions?.id) {
            return res.json({status:"Already taken this exam"});
        }
    }

    var examResult;

        const {result,testcase} = await Code.evaluate(false, questions, userID);

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

        for( const resu of testcase ) {
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


        const successResult = {
            status:'correct',
            input: result[0].input,
            output: result[0].output,
        }

        const score = (await Training.findOne({_id:questions?.id})).rating;
        const compl = questions.id;
        await CodeDB.findOneAndUpdate({ _id: questions?.id, number: questions?.number }, { $inc: { submission: 1 } }).then(()=>console.log("User qn updated"));
        await Student.findOneAndUpdate({_id:userID},{
            $push: {training: compl},
            $inc: {OAScore: score}
        },{new:true}).then(()=> {return res.json({status:"Submitted"})})
        .catch((err) => {return res.json({status: "Something went wrong"})})

}
