const { equal } = require("assert");
const Docker = require("dockerode");
const fs = require("fs");
const { default: container } = require("node-docker-api/lib/container");

const docker = new Docker();

const ubuntu = process.env.docUbuntu;
const python = process.env.docPython;
const cpp = process.env.docCpp;
const java = process.env.docJava;
var output;
var actualOutput = new Array();



async function PythonCodeOutput() {
  const docker = new Docker(); // Assuming you have imported the Docker library and created an instance named 'docker'.

  const createOptions = {
    Image: python, // Replace 'python' with the appropriate Python image name
    Cmd: [
      '/bin/sh',
      '-c',
      `chmod +x /app/main/* && python3 /app/main/main.py`,
    ],
    HostConfig: {
      Binds: [
        __dirname + '/../UserProgram/:/app/main',
      ],
    },
  };

  try {
    const container = await docker.createContainer(createOptions);
    const stream = await container.attach({ stream: true, stdout: true, stderr: true });
    await container.start();

    let stdoutData = ''; // Store the stdout data
    let stderrData = ''; // Store the stderr data

    await new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        const chunkData = chunk.toString();
        if (chunk.stderr) {
          stderrData += chunkData;
        } else {
          stdoutData += chunkData;
        }
      });

      stream.on('end', () => {
        resolve(); // Resolve the promise when the stream ends
      });

      stream.on('error', (err) => {
        reject(err); // Reject the promise if there's an error
      });
    });

    const data = await container.wait();
    await container.remove();

    console.log(stdoutData.trim())

    return { stdout: stdoutData.trim(), stderr: stderrData.trim() };
  } catch (err) {
    console.error(err);
  }
}


async function verifyOutput(status) {
  const compare = (Buffer.from([1,0,0,0,0,0,0,2,48])).toString();
  if( status == compare) {
    return "correct"
  }
  else {
    return 'incorrect'
  }
}

PythonCodeOutput();

exports.exec = async (username, number, code, input, output, testcase, language) => {
  var response,result;
  switch (language) {
    case "c":
      writeFile(username, number, code, language);
      writeOutput(username,number,output[0]);
      if (!input) {
        writeInputFile(username, number, input);
      } else {
        writeInputFile(username, number, "");
      }
      response = await Ccode(username,number,language);
      result = await verifyOutput(response);
      return result;

    case "cpp":
      writeFile(username, number, code, 'cpp');
      writeOutput(username,number,output[0]);
      if (!input) {
        writeInputFile(username, number, input);
      } else {
        writeInputFile(username, number, "");
      }
      response = await CppCode(username,number,'cpp');
      result = await verifyOutput(response);
      return result;

    case "python":
      writeFile(username, number, code, 'py');
      writeOutput(username,number,output[0]);
      if (!input) {
        writeInputFile(username, number, input);
      } else {
        writeInputFile(username, number, "");
      }
      response = await PythonCode(username,number,'py');
      var code_output = await PythonCodeOutput(username,number,'py')
      result = await verifyOutput(response);
      
      return {status:result,output:code_output};
  }
};

