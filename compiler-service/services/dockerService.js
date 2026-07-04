const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const runCode = async (language, code, input = "") => {

    let filename;
let command;

switch (language) {

    case "javascript":

        filename = `code-${Date.now()}.js`;

        command = (tempDir, filename, inputFile) =>
            `docker run --rm \
            --network none \
            --memory=256m \
            --cpus=1 \
            -v "${tempDir}:/code" \
            node:22 sh -c "node /code/${filename} < /code/${inputFile}"`;

        break;

    case "python":

        filename = `code-${Date.now()}.py`;

        command = (tempDir, filename, inputFile) =>
            `docker run --rm \
            --network none \
            --memory=256m \
            --cpus=1 \
            -v "${tempDir}:/code" \
            python:3.12 sh -c "python /code/${filename} < /code/${inputFile}"`;

        break;
        
    case "c":

        filename = `code-${Date.now()}.c`;

        command = (tempDir, filename, inputFile) =>
            `docker run --rm \
            --network none \
            --memory=256m \
            --cpus=1 \
            -v "${tempDir}:/code" \
            gcc:13 sh -c "gcc /code/${filename} -o /code/main && /code/main < /code/${inputFile}"`;

        break;
    
    case "cpp":

            filename = `code-${Date.now()}.cpp`;

            command = (tempDir, filename, inputFile) =>
                `docker run --rm \
                --network none \
                --memory=256m \
                --cpus=1 \
                -v "${tempDir}:/code" \
                gcc:13 sh -c "g++ /code/${filename} -o /code/main && /code/main < /code/${inputFile}"`;

            break;

        case "java":

            filename = "Main.java";

            command = (tempDir, filename, inputFile) =>
                `docker run --rm \
                --network none \
                --memory=256m \
                --cpus=1 \
                -v "${tempDir}:/code" \
                eclipse-temurin:21-jdk sh -c "javac /code/Main.java && java -cp /code Main < /code/${inputFile}"`;

            break;
    default:
        throw new Error("Unsupported Language");

}
    const tempDir = path.join(__dirname, "../temp");

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const inputFile = `input-${Date.now()}.txt`;

    const filepath = path.join(tempDir, filename);
    const inputPath = path.join(tempDir, inputFile);

    fs.writeFileSync(filepath, code);
    fs.writeFileSync(inputPath, input);

    const dockerCommand = command(tempDir, filename, inputFile);
    return new Promise((resolve, reject) => {

        exec( dockerCommand,{
        timeout: 5000,
        maxBuffer: 1024 * 1024
        }, (error, stdout, stderr) => {

            if (fs.existsSync(filepath))
                fs.unlinkSync(filepath);

            if (fs.existsSync(inputPath))
                fs.unlinkSync(inputPath);

            if (error) {
                if (error.killed) {
                    const err = new Error("Program exceeded the time limit.");
                    err.type = "Time Limit Exceeded";
                    return reject(err);
                }

                const message = stderr || error.message;

                const err = new Error(message);

                // Compilation Error
                if (
                    message.includes("error:") ||
                    message.includes("SyntaxError") ||
                    message.includes("javac") ||
                    message.includes("compilation terminated")
                ) {
                    err.type = "Compilation Error";
                }

                // Runtime Error
                else {
                    err.type = "Runtime Error";
                }

                return reject(err);
            }

            resolve(stdout);

        });

    });

};

module.exports = { runCode };