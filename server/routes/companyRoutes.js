const express = require("express");
const { getCompanies, updateCompanies } = require("../controllers/companyController");

const router = express.Router();

router.get("/", getCompanies);
router.post("/", updateCompanies);

module.exports = router;
