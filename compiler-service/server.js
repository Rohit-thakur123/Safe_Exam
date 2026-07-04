const express = require("express");
const cors = require("cors");
require("dotenv").config();
const executeRoutes = require("./routes/executeRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", executeRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Compiler Service Running 🚀"
    });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`Compiler Service running on port ${PORT}`);
});