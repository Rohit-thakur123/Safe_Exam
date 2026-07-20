const express = require("express");
const router = express.Router();

const { executeCode } = require("../controllers/executeController");

router.post("/execute", executeCode);
router.post("/compiler/run", executeCode);

module.exports = router;