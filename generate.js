const mongoose = require("mongoose")
const event = require("./Schema/user")
const db = process.env.db

mongoose.connect(db).then(() => console.log("Connected to database")).catch((err) => console.log(err));
( async()=> {
const evt = new event(
  {
    name: "Jane Smith",
    username: "jane_smith456",
    password: "strongpassword",
    role: "student",
    rollno: 5678,
    year: 2,
    semester: 4,
    department: "ECE",
    section: "B",
    college: "Manakula Vinayagar Institute of Technology",
    email: "janesmith@example.com",
    exams: [],
    completion: [],
  }
  
);

await evt.save().then(()=> console.log("Added")).catch((err) => console.log(err));
})();
