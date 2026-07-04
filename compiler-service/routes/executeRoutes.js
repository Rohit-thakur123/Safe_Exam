const express = require("express");
const router = express.Router();

const { executeCode } = require("../controllers/executeController");

router.post("/execute", executeCode);

module.exports = router;