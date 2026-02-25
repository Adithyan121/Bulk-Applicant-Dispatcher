const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema({
    email: String,
    company: String,
    role: String,
    place: String,
    website: String,
    dateSent: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("EmailLog", emailLogSchema);
