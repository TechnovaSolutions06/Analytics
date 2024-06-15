const mongoose = require("mongoose");
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const User = require("../Schema/user")
const Admin = require('../Schema/admin')
const SuperAdmin = require("../Schema/superadmin")
var secret = process.env.secret || "SuperK3y";

async function profileID(token) {
    var tok = token.headers.authorization;
    tok = tok.substring(7)
    var id;
    try {
        id = jwt.verify(tok, secret);
    }
    catch(err) {
        id = null;
    }
    const user = await SuperAdmin.findOne({_id:id.id});
    if(user) {
        return user;
    }
    else {
        const student = await User.findOne({_id:id.id});
        if(student)
                return student
        else
                return null
    }
}


const Activity = require("../Schema/loginactivity")
/*

A Middleware to check whether the user is login or not
- It only verify the login token and not the user type which is admin, superadmin and student.
- Return 401, if the user is not login.
- Otherwise it pass to the next function/routes.

*/
exports.verification = async (req,res,next) => {
    const authHeader = req.headers.authorization;
    var token;
    if( authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }

    else {
        return res.status(401).send("Unauthorized Access");
    }

    try {
        var decode = jwt.verify(token,secret);
    }
    catch {
        return res.status(401).send("Unauthorized Access");
    }
    return next();
}


/*

A Middleware to check whether the user is login or not
- It only verify the login token and also check the user type whether it is admin or not.
- Return 401, if the user is not login or not admin user.
- Otherwise it pass to the next function/routes.

*/
exports.adminVerification = async (req,res,next) => {
    const authHeader = req.headers.authorization;
    var token;
    if( authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }
    else {
        return res.status(401).send("Unauthorized Access");
    }
    try {
        var decode = jwt.verify(token,secret)
        var username = decode.username;
        const user = await User.findOne({username:username});
        if(decode.role === 'admin')
            return next();
        else
            return res.status(401).send("Admin can only access this page.");
    }
    catch {
        return res.status(301).send("You have to login first");
    }
}

/*

A Middleware to check whether the user is login or not
- It only verify the login token and also check the user type whether it is superadmin or not.
- Return 401, if the user is not login or not superadmin user.
- Otherwise it pass to the next function/routes.

*/
exports.superAdminVerification = async (req,res,next) => {
    const authHeader = req.headers.authorization;
    var token;
    if( authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }
    else {
        return res.status(401).send("Unauthorized Access");
    }
    try {
        var decode = jwt.verify(token,secret)
        var username = decode.username;
        const user = await SuperAdmin.findOne({username:username});
	    if(decode.role === 'superadmin')
            return next();
        else
            return res.status(401).send("Admin can only access this page.");
    }
    catch {
        return res.status(301).send("You have to login first");
    }
}


/*

- The Login Routes is used to login the user.
- POST Request.
- First it check whether the user is admin with Admin Schema, if found return the token.
- Otherwise it check whether the user is superadmin with SuperAdmin Schema if found return the token.
- Finally if not found in those schema, Check with student Schema if found return the token.
- Otherwise return 401 Invalid Password.

*/
exports.login = async (req,res) => {
    const { username, password } = req.body;
    var token;
    await Admin.findOne({username:username})
    .then(async (user) => {
        if(!user) {
            await SuperAdmin.findOne({username:username})
            .then( async (user) => {
                if(!user) {
                    await User.findOne({username:username})
                    .then( async (user) => {
                        console.log(user)
                        if(!user) {
                            return res.status(301).json({response:"Invalid Credits"})
                        }
                        if( await bcrypt.compare( password, user.password)) {
                            token = jwt.sign( {
                                    id:user._id,
                                    username:user.username,
                                    name:user.name,
                                    role: user.role,
                                    rollno: user.rollno,
                            },
                            secret,
                            {
                                expiresIn: '72hr'
                            }
                            );
                            const activity = await Activity.findOne({user_id:user._id});
                            if(!activity) {
                                const newActivity = Activity({
                                    user_id: user._id,
                                    ipaddress: req.ip,
                                    userAgent: req.get("user-agent"),
                                    date: new Date().getTime(),
                                    expiryAt: new Date(Date.now() + 4*60*60*1000),
                                });
                                newActivity.save().then(() => {return res.json({token:token})}).catch((err) => {console.log(err); return})
                            }
                            else if(activity.ipaddress !== req.ip) {
                                    return res.json({response:"Already login in different browser or place. Logout there to login here.",status:401})
                    }
                    return res.json({token:token});
                }
                        else {
                            return res.status(301).send({response:"Incorrect Password"});
                        }
                    })
                }
                else if( await bcrypt.compare( password, user.password)) {
                    token = jwt.sign( {
                            id:user._id,
                            username:user.username,
                            name:user.name,
                            role: user.role,
                            college: user.college,
                            rollno: user.rollno,
                    },
                    secret,
                    {
                        expiresIn: '72hr'
                    }
                    );
                    return res.json({token:token})
                }
                else {
                    return res.status(301).send({response:"Incorrect Password"});
                }
                }
            )
        }
        else if( await bcrypt.compare(password, user.password)) {
            var token = jwt.sign({
       		name: user.name,
	         username: user.username,
	        role: user.role
            },
            secret,{expiresIn:'24hr'})
            return res.json({token:token});
        }
        else 
            return res.status(401).json({response:"Incorrect Password"});
    })

}


/*
Register Routes.
- POST Request
- Create a new user, 
- If request body of role is admin, it create admin user.
- If request body of role is superadmin, it create superadmin user.
- If request body of role is student, it create student user.
- Exception if request body of role is undefined, it create a student user.
*/
exports.register = async (req,res) => {
    var { name, username,register, password, email, rollno, role} = req.body;
    const {college,department} = req.params;
    const encPassword = await bcrypt.hash(password, 5);
    var user;
    if(!role) {
        role = "";
    }
    if(role==="student") {
        user = new User( {
            name: name,
            username: username,
            password: encPassword,
            email: email,
            rollno: rollno,
            department: department,
	        register: register,
            college: college,
            role: role,
        });
    }
    else if(role === "superadmin") {
        user = new SuperAdmin( {
            name: name,
            username: username,
            password: encPassword,
            email: email,
            college: college,
            role: role,
        });
    }
    else if(role === "admin") {
        user = new Admin( {
            name: name,
            username: username,
            password: encPassword,
        });
    }
    else {
        user = new User( {
            name: name,
            username: username,
            password: encPassword,
            email: email,
            rollno: rollno,
            department: department,
            college: college,
            role: "student",
        });
    }
    user.save()
    .then( (data) => res.status(200).send({response:"Successfully created a user "}))
    .catch( (err) => res.status(301).send({response:"Something went wrong"}));
}

/*UPload
Not in use - Old feature, now not exist
*/ 
exports.registerUpload = async (req,res) => {
   const {users} = req.body;
   var exist = new Array();
   var newReg = new Array();
   for(const a of users) {
        var { name, username, password, email, rollno, role} = a;
        var {college,department} = req.params;
        if(!college) {
            const sa = await profileID(req);
            var college = sa.college;
        }
        const encPassword = await bcrypt.hash(password, 5);
        var user;
        if(!role) {
            role = "student";
        }

        if(role==="student") {
            var userExist = await User.findOne({username:username});
            if(userExist) {
                exist.push(username);
                continue;
            }
            user = new User( {
                name: name,
                username: username,
                password: encPassword,
                email: email,
                rollno: rollno,
                department: department,
                college: college,
                role: role,
            });
            console.log(user)
        }
        else if(role === "superadmin") {
            user = new SuperAdmin( {
                name: name,
                username: username,
                password: encPassword,
                email: email,
                college: college,
                role: role,
            });
        }
        else if(role === "admin") {
            user = new Admin( {
                name: name,
                username: username,
                password: encPassword,
            });
        }
        else {
            user = new User( {
                name: name,
                username: username,
                password: encPassword,
                email: email,
                rollno: rollno,
                department: department,
                college: college,
                role: "student",
            });
        }

        user.save().then((data) => {newReg.push(data.username)})
        .catch( (err) => {return res.json({response:"Something went wrong"})});
   }
   if(exist.length === 0) {
       return res.json({response:"Added new users"});
   }
   else {
        return res.json({response:"Some of user already exist", existUser:exist})
   }
}



exports.logout = async(req,res) => {
    const authHeader = req.headers.authorization;
    var token;
    if( authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    }

    else {
        return res.status(401).send("Unauthorized Access");
    }

    try {
        var decode = jwt.verify(token,secret);
        var user_id = decode.id
	await Activity.findOneAndDelete({user_id:user_id}).then(()=> {return res.json({status:"Log out"})}).catch(() => {return res.json({status:"Something went wrong"})})
    }
    catch {
        return res.status(401).send("Unauthorized Access");
    }
}


