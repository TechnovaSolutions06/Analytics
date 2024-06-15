const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const path = require('path');

/*
Java Program Routes
- Execute the code with the input
- The input is a list data type, each value is given as separate input.
- If the code has error, it return the status as Compilation error.
- Otherwise it return the output of the code.
*/
exports.java = async (user, examID, questions, i, input) => {
    const filePath = path.join(__dirname, 'UserProgram', `${user.name}${examID}${i}${questions.number}-input.java`);
    const filePathInput = path.join(__dirname, 'UserProgram', `${user.name}${examID}${i}${questions.number}-input`);
    const javaCode = questions.code;

    try {
        // Write the Java code to a file
        await fs.promises.writeFile(filePath, javaCode);

        // Compile the Java code using javac
        const compileCommand = `javac ${filePath}`;
        await exec(compileCommand);

        // Get the class name from the Java code
        const className = javaCode.match(/class\s+([^\s]+)/);
        const javaClassName = className ? className[1] : 'Main';

	var inputData;
        // Prepare input data
	if(typeof(input) !== typeof(new Array())) {
		inputData = input;
	}
	else
	        inputData = input.join('\n') + '\n';

        await fs.promises.writeFile(filePathInput, inputData);
        

        // Execute the Java code and pass input data
        const executeCommand = `java -classpath ${path.dirname(filePath)} ${javaClassName}`;
        const { stdout, stderr } = await exec(` ${executeCommand} < ${filePathInput}`);

        // Clean up the compiled .class file
        const classFilePath = path.join(path.dirname(filePath), `${javaClassName}.class`);
        await fs.promises.unlink(classFilePath);

        return stdout.trim();
    } catch (error) {
	console.log(error)
        return {status:'Compilation error',error:error }
    }
};
