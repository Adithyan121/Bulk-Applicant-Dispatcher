const EmailLog = require("../models/EmailLog");

const getLogs = async (req, res) => {
    try {
        const logs = await EmailLog.find().sort({ dateSent: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch logs" });
    }
};

module.exports = {
    getLogs
};
