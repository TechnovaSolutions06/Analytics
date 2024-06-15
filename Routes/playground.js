const python = require("./python");
const c = require("./c")
const java = require("./java");
const PlaygroundDB = require("../Schema/playground");
const jwt = require("jsonwebtoken")
const secret = process.env.secret;

async function userID(authHeader)  {
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
exports.playground = async (req,res) => {
    const { code, input, language } = req.body;
    let user = req.headers.authorization
    let examID = 123;
    let number = 1
    var inputValue;
    if(!input)
	inputValue = new Array();
    else
	inputValue = input
    let questions = {
        number: number,
        code: code
    }
    var outputArray = new Array();
    for(const io of input) {
	switch(language) {
	 case "python":
		 output = await python.python(user, examID, questions, 1, io);
   	  	 outputArray.push(output);
		 break;
	 case "c":
		output = await c.c(user,examID, questions, 1, io);
		outputArray.push(output);
		break;
	 case "cpp":
		output = await c.cpp(user,examID,questions, 1, io);
		outputArray.push(output);
		break;
	case "java":
		output = await java.java(user,examID, questions, 1,io);
		outputArray.push(output);
		break;
	}
    };
    return res.json({output:outputArray});
}

/*
- Create a new playground on their account.
- Question, input and codes are saved.
*/
exports.save = async(req,res) => {
	const { name, question, input, code, language } = req.body;
	const token = req.headers.authorization;
	const userid = await userID(token);
	const pg = new PlaygroundDB({
		name: name,
		userid: userid,
		question: question,
		input: input,
		code: code,
		language: language,
	});
	pg.save().then((data) => {return res.json({id:data._id,status:"Saved"})}).catch((err) => {return res.json({status:"Not saved"})});
}

/*
- Edit a existing playground on their account.
- Question, input and codes are editable.
*/
exports.edit = async(req,res) => {
	const { question, name, input, code, language } = req.body;
	const {id} = req.params;
	const token = req.headers.authorization;
	const userid = await userID(token);

	const pg = {
		name: name,
		userid: userid,
		question: question,
		input: input,
		code: code,
		language: language,
	}

	await PlaygroundDB.findOneAndUpdate({_id:id},pg,{new:true}).then(() => {return res.json({status:"Update"})}).catch(() => {return res.json({status:"Not update"})});

}

/*
- Get all the saved playground details on their account.
*/
exports.get = async(req,res) => {
        const { question, input, code, language } = req.body;
        const token = req.headers.authorization;
        const userid = await userID(token);
	const pg = await PlaygroundDB.find({userid: userid});
	if(!pg)
		return res.json({status:"Not saved"});
	else
		return res.json({playground:pg});
}

/*
- Get the specific playground detail on their account.
*/
exports.getpg = async(req,res) => {
	const {id} = req.params;
	const pg = await PlaygroundDB.findOne({_id:id});
	if(!pg)
		return res.json({status:"No playground like this"});
	else
		return res.json({playground:pg});

}

/*
- Delete a existing playground on their account.
- Question, input and codes are deleted.
*/
exports.delete = async(req,res) => {
	const {id} = req.params;
	await PlaygroundDB.findOneAndDelete({_id:id})
	return res.json({status:"Deleted"});

}
