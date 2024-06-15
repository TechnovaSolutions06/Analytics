const mongoose = require("mongoose");

const url = "mongodb+srv://shell:1234@analytics.cayz4kx.mongodb.net/analytics";

const options = {useNewUrlParser: true, useUnifiedTopology: true}
/*
- Connect to the database.
- The url is set in environment as db.
- [ Update with client db in future. Now it is developer account ].
*/
exports.connection = () => {
    mongoose.connect(url,options)
    .then((data) => console.log("Connected to the database"))
    .catch((err) => console.log(err));
}
