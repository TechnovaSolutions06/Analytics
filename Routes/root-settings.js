const bcrypt = require("bcrypt");
const SuperAdmin = require("../Schema/admin");
const College = require("../Schema/college");


exports.user = async(req,res) => {
    const {userID} = req.params;
    const userOld = await SuperAdmin.findOne({_id:userID},{password:0})
    if(userOld) {
        const college = await College.findOne({_id:userOld.college})
        if(dept && college) {
            return res.json({
                username: userOld.username,
                name: userOld.name,
                image: userOld.image,
            })
        }
    }
    else {
        return res.json({user:"Not found"})
    }
}

exports.personal = async(req,res) => {
    const {userID} = req.params;
    const userOld = await SuperAdmin.findOne({_id:userID})

    var {name, email, rollno, imageData } = req.body;
    const UpdateUser = {
        name: name === undefined || name === null ? userOld.name : name,
        username: userOld.username,
        image: imageData === undefined || imageData === null ? userOld.image : imageData
    };

    try {
        await SuperAdmin.findOneAndUpdate({_id:userID}, UpdateUser, {new: true});
        return res.json({status:"Updated"})
    }
    catch(e) {
        return res.json({status:"Error"})
    }
}

exports.security = async(req,res) => {
    const {userID} = req.params;
    const userOld = await SuperAdmin.findOne({_id:userID})

    var {oldpassword, password} = req.body;
    if( await bcrypt.compare(oldpassword, userOld.password)) {
        const encPassword = await bcrypt.hash(password, 5);
        try {
            await SuperAdmin.findOneAndUpdate({_id:userID},{$set: {password: encPassword}}, {new: true})
            return res.json({status:"Updated"})
        }
        catch(e) {
            return res.json({status:"Error"})
        }
    }
    else {
        return res.json({status:"Incorrect password"})
    }
}
