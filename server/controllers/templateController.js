const fs = require("fs/promises");
const path = require("path");

const TEMPLATE_DIR = path.join(process.cwd(), "templates");

// Ensure templates dir exists
fs.mkdir(TEMPLATE_DIR, { recursive: true }).catch(console.error);

const getTemplates = async (req, res) => {
    try {
        const files = await fs.readdir(TEMPLATE_DIR);
        const templates = files.filter(file => file.endsWith('.txt') || file.endsWith('.html'));
        res.json(templates);
    } catch (err) {
        res.status(500).json({ error: "Failed to list templates" });
    }
};

const getTemplateByName = async (req, res) => {
    try {
        const filePath = path.join(TEMPLATE_DIR, req.params.name);
        const content = await fs.readFile(filePath, "utf-8");
        res.json({ name: req.params.name, content });
    } catch (err) {
        res.status(404).json({ error: "Template not found" });
    }
};

const saveTemplate = async (req, res) => {
    try {
        const { name, content } = req.body;
        if (!name || !content) return res.status(400).json({ error: "Name and content required" });

        // Ensure .txt extension for standard English templates
        const fileName = (name.endsWith('.txt') || name.endsWith('.html')) ? name : `${name}.txt`;
        await fs.writeFile(path.join(TEMPLATE_DIR, fileName), content);
        res.json({ message: "Template saved", fileName });
    } catch (err) {
        res.status(500).json({ error: "Failed to save template" });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const filePath = path.join(TEMPLATE_DIR, req.params.name);
        await fs.unlink(filePath);
        res.json({ message: "Template deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete template" });
    }
};

module.exports = {
    getTemplates,
    getTemplateByName,
    saveTemplate,
    deleteTemplate
};
