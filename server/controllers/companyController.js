const fs = require("fs/promises");
const path = require("path");
const EmailLog = require("../models/EmailLog");

const companiesPath = path.join(process.cwd(), "companies.json");

const getCompanies = async (req, res) => {
    try {
        const data = await fs.readFile(companiesPath, "utf-8");
        const companies = JSON.parse(data);

        // Enrich with last sent date
        const enrichedCompanies = await Promise.all(companies.map(async (company) => {
            if (!company.email) return company;
            const lastLog = await EmailLog.findOne({ email: company.email }).sort({ dateSent: -1 });
            return {
                ...company,
                lastSent: lastLog ? lastLog.dateSent : null
            };
        }));

        res.json(enrichedCompanies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to read companies file" });
    }
};

const updateCompanies = async (req, res) => {
    try {
        const newCompanies = req.body;
        await fs.writeFile(companiesPath, JSON.stringify(newCompanies, null, 2));
        res.json({ message: "Companies updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to save companies file" });
    }
};

module.exports = {
    getCompanies,
    updateCompanies
};
