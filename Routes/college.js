const mongoose = require('mongoose')
const Student = require("../Schema/user")
const Department = require("../Schema/department")

const CollegeDB = require("../Schema/college")


exports.list = async () => {
    const colleges = await Department.find({},{department:0,_id:0,__v:0,year:0,section:0,semester:0})
    return colleges;
}

/*
- Create a new department for the college.
- The collection have department, year, semester and section.
- Database name is departments.
*/
exports.addDept = async (req,res) => {
    const {department,year,semester,section} = req.body;
    const college = req.params.college;
    const clgExist = await Department.findOne({college:college,department:department,year:year,section:section,semester:semester});
    if(clgExist) {
        return res.json({status:"Already exist"})
    }
    const clg = await Department({
        college: college,
        department: department,
        year: year,
        semester: semester,
        section: section,
    })

    clg.save()
    .then((data) => {return res.json({status:"New department was added"})})
    .catch((err) => {return res.json({status:"Something went wrong"})})
}

/*
- Get all the department of the specific college.
- Return the department name, year, semester and section and college name
*/
exports.department = async (req,res) => {
    const {college} = req.params;
    const collegeName = await CollegeDB.findOne({_id:college})
    if(!collegeName) {
        return res.json({college:"Not exist"})
    }
    else {
        const collegesArray = await Department.find({college:college},{college:0});
        return res.json({college:collegeName.college, departments: collegesArray})
    }
}


/*
- Get all the student detail of the department on the college.
- Return the user deatils such as name, username, email, Overall score and roll number.
*/
exports.student = async (req, res) => {
    const { college, department } = req.params;
    const collegeName = await CollegeDB.findOne({_id:college});
    const DepartmentDetail = await Department.findOne({_id:department});
    if(!collegeName){
        return res.json({college:"Not exit"})
    }
    if(!DepartmentDetail){
        return res.json({department:"Not exist"})
    }
    const students = await Student.find({ college: college, department: department }, { __v: 0, username: 0, password: 0, role: 0,image:0 }).sort({ name: 'asc' });
  
    return res.json({ college: collegeName.college, department: DepartmentDetail.department, year: DepartmentDetail.year,semester: DepartmentDetail.semester, section: DepartmentDetail.section, students: students });
  };
  

/*
- Create a new college
- Database name is college.
- The parameter is name and place.
- [ Update with image. ]
*/
exports.new = async (req,res) => {
    const {college,place} = req.body;
    var clg = await CollegeDB.findOne({college:college})
    if(clg){
        return res.json({response:"Already exist"})
    }
    CollegeDB.create({
	    _id:new mongoose.Types.ObjectId(), 
        college: college,
        place: place,
    })
    .then((data) => {return res.json({response:"done"})})
    .catch((err) => {return res.json("Something went wrong")});

}

/*
- Listout the college added by the admin.
- Return the college name and place.
- [ Update with image. ]
*/
exports.college = async(req,res) => {
    const clg = await CollegeDB.find({});
    return res.json({colleges:clg});
}
