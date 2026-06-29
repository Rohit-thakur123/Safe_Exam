import axios from "axios";

export const runCode = async (req, res) => {
  try {
    const { language, code } = req.body || {};

    if (!language || !code) {
      return res.status(400).json({
        success: false,
        message: "language and code are required"
      });
    }

    const response = await axios.post(
      "https://emkc.org/api/v2/piston/execute",
      {
        language,
        version: "*",
        files: [
          {
            content: code,
          },
        ],
      }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Piston Error:");
    console.error(error.response?.data);
    console.error(error.message);

    return res.status(500).json({
      success: false,
      message: "code execution failed",
    });
  }
};



