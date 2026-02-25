const express = require("express");
const {
    getTemplates,
    getTemplateByName,
    saveTemplate,
    deleteTemplate
} = require("../controllers/templateController");

const router = express.Router();

router.get("/", getTemplates);
router.get("/:name", getTemplateByName);
router.post("/", saveTemplate);
router.delete("/:name", deleteTemplate);

module.exports = router;
