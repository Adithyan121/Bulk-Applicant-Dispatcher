const fs = require("fs/promises");
const path = require("path");
const nodemailer = require("nodemailer");
const EmailLog = require("../models/EmailLog");

const TEMPLATE_DIR = path.join(process.cwd(), "templates");

const getTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : ''
        }
    });
};

function extractCompanyName(email) {
    if (!email || !email.includes("@")) return "Company";
    const domain = email.split("@")[1].split(".")[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
}

function fillTemplate(template, data) {
    let result = template;
    for (const key in data) {
        const value = data[key] || "";
        result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return result;
}

const sendEmails = async (req, res) => {
    try {
        const { force, specificEmail, templateName } = req.body;
        const transporter = getTransporter();

        // Default to finding a .txt or .html file if not specified
        let selectedTemplate = templateName;
        if (!selectedTemplate) {
            const ObjectKeys = await fs.readdir(TEMPLATE_DIR);
            selectedTemplate = ObjectKeys.find(f => f.endsWith('.txt') || f.endsWith('.html')) || ObjectKeys[0];
        }

        if (!selectedTemplate) {
            return res.status(400).json({ error: "No templates found. Please create one first." });
        }

        const [companiesRaw, profileRaw, templateRaw] = await Promise.all([
            fs.readFile(path.join(process.cwd(), "companies.json"), "utf-8"),
            fs.readFile(path.join(process.cwd(), "profile.json"), "utf-8"),
            fs.readFile(path.join(TEMPLATE_DIR, selectedTemplate), "utf-8")
        ]);

        let companies = JSON.parse(companiesRaw);

        if (specificEmail) {
            companies = companies.filter(c => c.email === specificEmail);
        }

        const profile = JSON.parse(profileRaw);
        const template = templateRaw;
        const resumePath = path.join(process.cwd(), "resumes", `${process.env.resumePath || "Resume.pdf"}`);

        const results = [];

        for (const company of companies) {
            if (!company.email || !company.email.includes("@")) {
                results.push({ email: company.email, status: "Skipped", reason: "Invalid Email" });
                continue;
            }

            if (!force) {
                const lastLog = await EmailLog.findOne({ email: company.email }).sort({ dateSent: -1 });

                if (lastLog) {
                    results.push({ email: company.email, status: "Skipped", reason: "Already Sent" });
                    continue;
                }
            }

            const companyName = company.company || extractCompanyName(company.email);

            const filledTemplateContent = fillTemplate(template, {
                role: company.role,
                company: companyName,
                place: company.place,
                my_place: profile.my_place,
                name: profile.name,
                my_email: profile.my_email,
                ph_number: profile.phone_no
            });

            // If it's a plain text template, preserve newlines by replacing with <br>
            const isTxt = selectedTemplate.endsWith('.txt');
            const htmlContent = isTxt ? filledTemplateContent.replace(/\r?\n/g, '<br>') : filledTemplateContent;

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: company.email,
                subject: `Application for ${company.role} Position`,
                html: htmlContent,
                attachments: [
                    {
                        filename: "Adithyan_G_Resume.pdf",
                        path: resumePath
                    }
                ]
            };

            try {
                await transporter.sendMail(mailOptions);

                await new EmailLog({
                    email: company.email,
                    company: companyName,
                    role: company.role,
                    place: company.place,
                    website: company.website
                }).save();

                results.push({ email: company.email, status: "Sent" });
            } catch (err) {
                console.error(`❌ Failed to send to ${company.email}:`, err.message);

                let reason = err.message;
                if (err.responseCode === 535) {
                    reason = "GMAIL AUTH FAILED: You need a generic 'App Password' from Google Security settings. Update .env and Restart Server.";
                }

                results.push({ email: company.email, status: "Failed", reason });
            }
        }

        res.json({ message: "Process complete", results });

    } catch (err) {
        console.error("Error in sending emails:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = {
    sendEmails
};
