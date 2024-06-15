const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const path = require('path');

/*
Python Program Routes
- Execute the code with the input
- The input is a list data type, each value is given as separate input.
- If the code has error, it return the status as Compilation error.
- Otherwise it return the output of the code.
*/
exports.python = async (user, examID, questions,i,input) => {
    const filePath = path.join(__dirname, 'UserProgram', `${user.name}${examID}${i}${questions.number}-input`);
    var inputData;
    if(typeof(input) !==  typeof(new Array())){
	  inputData = input;
    }
    else
	  inputData = input.join('\n')+'\n'; // Assuming the input file contains the same content as questions.code

   const codePath = path.join(__dirname,"UserProgram",`${user.name}${examID}${i}${questions.number}.py`);
    try {
        await fs.promises.writeFile(filePath, inputData);
	    await fs.promises.writeFile(codePath, questions.code);

        const { stdout, stderr } = await exec(`python3 "${codePath}" < ${filePath}`);


        return stdout.trim();
    } catch (error) {
        return {status:'Compilation error',error:error }
    }
}


