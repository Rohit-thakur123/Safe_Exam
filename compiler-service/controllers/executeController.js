const { runCode } = require("../services/dockerService");


const executeCode = async (req, res) => {

    try {

        const { language, code, input } = req.body;

        if (!language || !code) {
            return res.status(400).json({
                success: false,
                message: "Language and Code are required."
            });
        }

        const output = await runCode(language, code, input);

        res.json({
            success: true,
            output
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            type: err.type || "Unknown Error",
            message: err.message
        });

    }

};

module.exports = { executeCode };