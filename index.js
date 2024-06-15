/*
The Backend Application for the analyticsedify software

All the APIs and routes are integrated here.
For the database, we use the atlas mongodb cloud.

Dev: Rakesh Kumar

*/


// The Prequistes library for this project
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors")
const fs = require("fs");
const path = require("path")

// Socket Connection
const { createServer } = require("http");
const { Server } = require("socket.io");

// The APIs Routes program
const databse = require("./Routes/dbconnection")
const auth = require("./Routes/authentication")
const mcqs = require("./Routes/mcqs")
const code = require("./Routes/CodingQN")
const contact = require("./Routes/contactus")
const Student = require("./Routes/student")
const Events = require("./Routes/events")
const College = require("./Routes/college")
const TechEvent = require("./Routes/techevent")
const Deletion = require("./Routes/delete")
const Edit = require("./Routes/edit")
const Meet = require("./Routes/meeting")
const Play = require("./Routes/playground")
const playqn =require("./Routes/playgroundqn.js")
const Training = require("./Routes/training")
const SuperAdmin = require("./Routes/superadmin")
const Dashboard = require("./Routes/dashboard")
const AD = require("./Routes/profileadmin.js")
const AdminSettings = require("./Routes/root-settings.js")
const SuperSettings = require("./Routes/admin-settings.js")
const Settings = require("./Routes/settings.js")
const scoreRoutes =require("./Routes/scoreboard.js")

// Middleware for the cross origin resources shares.
const app = express();
app.use(cors({
	origin: "*",
	methods: "GET,POST,PUT,DELETE"
}));

app.use(bodyParser.json({ limit: '20mb' }));
app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }))

// SSL Certificate Configuration
// const sslOptions = {
//  key: fs.readFileSync('/home/ubuntu/Analytics/ssl/key.pem'),
//   cert: fs.readFileSync('/home/ubuntu/Analytics/ssl/cert.pem')
// };
const sslOptions = {}
const httpServer = createServer(sslOptions,app);


// Middleware to enable the json and body data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser())
app.set('trust proxy', true);

// // WebSocket Server Creation
// const io = new Server(httpServer);

// // Web socket API
// io.on("connection",async (socket) => {
//     // All can be used dashboard
//     socket.emit("exams",await Events.listout()); // Exam - Pages 
//     socket.emit("colleges",await College.list()); // College - Page
//     socket.emit("events", await TechEvent.dashboard()); // Event - Page
// })


// Database connection with cloud mongodb
try {
	databse.connection();
}
catch {
	console.error("Unable to connect with database")
	process.exit(1);
}

// Root directory
app.get("/",(req,res) => res.send("Hello world"))


// Login and student registration
app.post("/login", (req,res) => auth.login(req,res) );
app.post("/admin/register",auth.adminVerification, (req,res) => auth.register(req,res));
app.post("/admin/register/upload", auth.adminVerification, auth.registerUpload);
app.get("/logout", auth.logout);

app.get("/student/dashboard", auth.verification, Dashboard.student)
app.get("/superadmin/dashboard", auth.superAdminVerification, Dashboard.superadmin);
app.get("/admin/dashboard", auth.adminVerification, Dashboard.admin);

/*
Admin Panel Exam APIs [ GET, POST ]
-----------------------------------

- root: /admin/

GET - /exams - Views all the exam were allocated.
GET - /exams/:examID/questions - Listout the questions of the particular 
GET - /exams/:examID - Listout the student list, whose are going to attend the exams
POST - /add - Add the new exam to the department of the college.

*/

app.get("/admin/exams", auth.adminVerification,Events.adminDashboard); // Exam - Add Page
app.get("/admin/exams/:examID/questions", auth.adminVerification,Events.examof); // Exam - Question Detail
app.get("/admin/exams/:examID",auth.adminVerification,Events.examDetail); // Exam - Student Detail
app.post("/admin/exams/add", auth.adminVerification, Events.new);


/*

Admin Panel College, Department and Student APIs [ GET, POST ]
--------------------------------------------------------------

- root: /admin

POST - /colleges/add - Add a new college.
GET  - /colleges - Listout the colleges which were created by admin and superadmin
POST - /colleges/:college/add - Add a new department for the particular college (:college).
GET  - /colleges/:college - List out the department on the college.
GET  - /colleges/:college/:department - List out the student list, those who were studies in the department of the college.
POST - /colleges/:college/:department/add - Add a new student for the corresponding college and department ID.


*/
app.post("/admin/colleges/add", auth.adminVerification, College.new)
app.get("/admin/colleges",auth.adminVerification,College.college)
app.post("/admin/colleges/:college/add", auth.adminVerification, College.addDept);
app.get("/admin/colleges/:college", auth.adminVerification, College.department); 
app.get("/admin/colleges/:college/:department", auth.adminVerification, College.student); 
app.post("/admin/colleges/:college/:department/add", auth.adminVerification, auth.registerUpload); // Student - New Page
 
/*

Admin Panel Event APIs [ GET, POST ]
------------------------------------

GET  - /event - Listout the event will be organized.
GET  - /event/:eventID - View the details of the particular event.
POST - /event/add - Add a new event.

*/
app.get("/admin/event", auth.adminVerification, TechEvent.evt);
app.get("/admin/event/:eventID", auth.adminVerification, TechEvent.event); // Event details
app.post("/admin/event/add", auth.adminVerification, TechEvent.newevent); // Event - Add Page.


/*

Admin Panel Deletion APIs
-------------------------

- root: /admin/

DELETE - /exams/:examID - Delete the particular exam.
DELETE - /colleges/:collegeID - Delete the college, which can also delete the department and student of the college.
DELETE - /colleges/:collegeID/:departmentID - Delete the department and student of the college.
DELETE - /colleges/:collegeID/:departmentID - Delete the student of the department in the college.
DELETE - /event/:eventID - Delete the event.

*/
app.delete("/admin/exams/:examID", auth.adminVerification, Deletion.exam);
app.delete("/admin/colleges/:collegeID", auth.adminVerification, Deletion.college);
app.delete("/admin/colleges/:collegeID/:departmentID", auth.adminVerification, Deletion.department)
app.delete("/admin/colleges/:collegeID/:departmentID/:userID", auth.adminVerification, Deletion.user);
app.delete("/admin/event/:eventID", auth.adminVerification, Deletion.event)



/*

Admin Panel Edit APIs
---------------------

- root: /admin/

PUT - /exams/:examID - Edit the particular exam.
PUT - /colleges/:collegeID - Edit the college details like name, images, etc.
PUT - /colleges/:collegeID/:departmentID - Edit the department detail of the college.
PUT - /colleges/:collegeID/:departmentID - Edit the student detail of the department in the college.
PUT - /event/:eventID - Edit the event detail.

*/
app.put("/admin/exams/:examID", auth.adminVerification, Edit.exam);
app.put("/admin/exams/:examID/:sectionID", auth.adminVerification, Edit.section);
app.put("/admin/colleges/:collegeID", auth.adminVerification, Edit.college);
app.put("/admin/colleges/:collegeID/:departmentID", auth.adminVerification, Edit.department);
app.put("/admin/colleges/:collegeID/:departmentID/:userID", auth.adminVerification, Edit.user);
app.put("/admin/event/:eventID", auth.adminVerification, Edit.event);


app.get("/admin/colleges/:collegeID/:departmentID/:userID/details",auth.adminVerification,Dashboard.studentDetail)

/*
Superadmin Panel Exam APIs
--------------------------

- root: /superadmin/

GET  - /exams - Listout the exams created for their college.
POST - /exams/add - Create the new exams for their college.

*/
app.get("/superadmin/exams", auth.superAdminVerification,SuperAdmin.exam); // Exam - Add Page
app.get("/superadmin/exams/:examID", auth.superAdminVerification, SuperAdmin.examDetail);
app.get("/superadmin/exams/:examID/questions", auth.superAdminVerification,Events.examof); // Exam - Question Detail
app.post("/superadmin/exams/add", auth.superAdminVerification, SuperAdmin.newExam);
app.delete("/superadmin/exams/:examID", auth.superAdminVerification, Deletion.exam)
app.put("/superadmin/exams/:examID", auth.superAdminVerification, Edit.exam);
app.put("/superadmin/exams/:examID/:sectionID", auth.superAdminVerification, Edit.section);


app.get("/superadmin/department/:departmentID/:userID/details",auth.superAdminVerification,Dashboard.studentDetail)

/*

Superadmin Panel Department and Student APIs
----------------------------------------------

- root: /superadmin/

GET  - /department - Listout the department of their college.
POST - /department/add - Add a new department of their college. 
GET  - /department/:departmentID/students - Listout the student of the department.
POST - /department/:departmentID/add - Create a new student of the corresponding department of their college.

*/
app.get("/superadmin/department", auth.superAdminVerification, SuperAdmin.dept);
app.post("/superadmin/department/add", auth.superAdminVerification, SuperAdmin.newDept);

app.delete("/superadmin/department/:departmentID", auth.superAdminVerification, SuperAdmin.delDept);
app.get("/superadmin/department/:departmentID", auth.superAdminVerification, SuperAdmin.student);
app.post('/superadmin/department/:department/add', auth.superAdminVerification, auth.registerUpload)
app.delete('/superadmin/department/:department/:userID', auth.superAdminVerification, Deletion.user)

app.put("/superadmin/department/:departmentID", auth.superAdminVerification, Edit.department);
app.put("/superadmin/department/:departmentID/:userID", auth.superAdminVerification, Edit.user);
/*

SuperAdmin Panel Event and Das hboard APIs
-----------------------------------------

- root : /superadmin/

GET - /events - Listout the events of their college.
GET - /dashboard - Return all the details required for the dashboard panel.

*/
app.get("/superadmin/event", auth.superAdminVerification, SuperAdmin.event);
app.get("/superadmin/dashboard", auth.superAdminVerification, SuperAdmin.profile);


/*

Student Panel Dashboard and Exam APIs
-------------------------------------

- root: /student/

GET - /profile - Return all the details required for the dashboard panel.
GET - /exams - Listout the exams allocated for them.
GET - /exams/:examID - Return the detail about the corresponding exam. 
GET - /exams/:examID/start - Return the question for the corresponding exam.
POST - /exams/:examID/validate - Validate the answer for the Coding question only.(Execution for coding).
POST - /exams/:examID/submit - Submit the coding answer to the server.
GET  - /exams/:examID/result - Return the scorepoint of the corresponding exam.
*/
app.get("/student/profile", auth.verification, Student.profile);
app.get('/student/profileImage', auth.verification, Student.profileImage);
app.get("/student/exams", auth.verification, Student.exam )
app.get("/student/exams/:examID", auth.verification, Student.examDetail)
app.get("/student/exams/:examID/:sectionID/start", auth.verification, Student.examStart);

app.post("/student/exams/:examID/:sectionID/evaluate", auth.verification, Student.examEval);
app.post("/student/exams/:examID/:sectionID/submit", auth.verification, Student.examSubmit);

app.get("/student/exams/:examID/:sectionID/answer", auth.verification, Student.examAnswer);



/*

Student Panel of Event and Scoreboard
-------------------------------------

- root: /student/

GET - /events - Listout the event allocated for them.
GET - /scoreboard - Return the scorepoint within the college level.
*/
app.get("/student/events", auth.verification, Student.event);
app.get("/student/scoreboard", auth.verification, Student.scoreboard);
app.get("/admin/scoreboard", auth.verification, Student.adminScoreboard);
app.get("/student/scoreboard/:studentid", auth.verification, scoreRoutes.score);
app.get("/admin/scoreboard/:studentid", auth.verification, scoreRoutes.adminscore);
// /*
// POST - /contactus - Store the queries in database and view it on future.
// */
app.post("/contactus", (req,res) => contact.contact(req,res));


/*
Student Panel of Playground
---------------------------

- root: /student/playground/

POST - /save - Create a new playground for them.
GET - / - Return all the playground created by them.
GET - /:id - Return the detail like question, input and code which were stored in database as playground.
PUT - /:id - Edit the detail of the playground like question, input or code.
DELETE - /:id - Delete the playground.

*/
app.post("/student/playground/save", auth.verification, Play.save);
app.get("/student/playground", auth.verification, Play.get);
app.get("/student/playground/:id", auth.verification, Play.getpg);
app.put("/student/playground/:id", auth.verification, Play.edit);
app.delete("/student/playground/:id", auth.verification, Play.delete);
app.post("/student/playground/:id", auth.verification, Play.playground);
app.post("/student/playground/run", auth.verification, Play.playground);
app.post("/student/playgroundqn", auth.verification, playqn.postQuestion);
// app.get("/student/getAssignedQuestions", auth.verification, playqn.getAssignedQuestions);




/*
Student Panel of Training API
-----------------------------

- root: /student/training

GET - / - Return all the question for training.
POST - /submit - Submit the coding answer for training session.
POST - /evaluate - Just execute and return the output of the code.
GET - /:examID/timeout - Try to auit the exam for the student due to over time.

*/
app.get("/student/training", auth.verification, Training.training);
app.post("/student/training/submit", auth.verification, Training.submit);
app.post("/student/training/evaluate", auth.verification, Training.evaluate);
app.get("/student/exams/:examID/timeout", auth.verification, Student.timeout);


app.get("/admin/meeting", auth.adminVerification, Meet.admin);
app.get("/admin/meeting/:meetingID", auth.adminVerification,Meet.adminMeet)
app.post("/admin/meeting/add", auth.adminVerification, Meet.newAdmin);

app.get("/superadmin/meeting", auth.superAdminVerification, Meet.superadmin);
app.get("/superadmin/meeting/:meetingID", auth.superAdminVerification, Meet.superadminMeet)
app.post("/superadmin/meeting/add", auth.superAdminVerification, Meet.newSuperAdmin);

app.delete("/admin/meeting/:meetingID", auth.adminVerification, Meet.delete)
app.delete("/superadmin/meeting/:meetingID", auth.superAdminVerification, Meet.delete)


// Settings Panel
app.get("/student/settings/:userID", auth.verification, Settings.user)
app.post("/student/settings/:userID/personal", auth.verification, Settings.personal)
app.post("/student/settings/:userID/security", auth.verification, Settings.security)
app.get("/student/settings/:userID/image", auth.verification, Settings.image)

app.get("/student/meeting", auth.verification, Meet.student);
app.get("/student/meeting/:meetingID", auth.verification, Meet.superadminMeet)

/* Superadmin Panel access through Admin Panel */
app.get("/admin/superadmins", auth.adminVerification, SuperAdmin.getSA)
app.get("/admin/superadmins/:superadminID", auth.adminVerification, SuperAdmin.getSAS)
app.delete("/admin/superadmins/:superadminID", auth.adminVerification, SuperAdmin.delSAS)
app.get("/admin/superadmins/department", auth.adminVerification, SuperAdmin.dept)
app.get("/admin/superadmins/department/:departmentID", auth.adminVerification,SuperAdmin.student )

app.post("/admin/college/:college/adduser", auth.adminVerification, auth.register)
app.post("/admin/register", auth.adminVerification, auth.register)
app.get("/admin/admins", auth.adminVerification, SuperAdmin.getAD)


app.get('/superadmin/settings/:userID', auth.superAdminVerification, SuperSettings.user);
app.post('/superadmin/settings/:userID/personal', auth.superAdminVerification, SuperSettings.personal)
app.post('/superadmin/settings/:userID/security', auth.superAdminVerification, SuperSettings.security)


app.get('/admin/settings/:userID', auth.adminVerification, AdminSettings.user);
app.post('/admin/settings/:userID/personal', auth.adminVerification, AdminSettings.personal)
app.post('/admin/settings/:userID/security', auth.adminVerification, AdminSettings.security)


/* Image Access API*/
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  // Check if the file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'Image not found' });
  }
});


httpServer.listen(8080);
