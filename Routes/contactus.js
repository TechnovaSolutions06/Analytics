const mongoose = require("mongoose");
const Contact = require("../Schema/contact")

/*
- Save the message send by the user.
- [ Update this contact. To visible to the admin panel. ]
*/
exports.contact = async (req,res) => {
    const { firstname, lastname, mail, phone, message } = req.body;
    const con = Contact({
        firstname: firstname,
        lastname: lastname,
        mail: mail,
        phone: phone,
        message: message
    });

    await con.save()
    .then((data) => res.json({response:"sended"}))
    .catch((err) => res.json({response:err}));

}