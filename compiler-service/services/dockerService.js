const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const runCode = async (language, code, input = "") => {
    let filename;
    let command;

    switch (language.toLowerCase()) {
        case "javascript":
            filename = `code-${Date.now()}.js`;
            command = (dir, fn, inputFn) =>
                `docker run --rm --network none --memory=256m --cpus=1 -v "${dir}:/code" node:22 sh -c "node /code/${fn} < /code/${inputFn}"`;
            break;

        case "python":
            filename = `code-${Date.now()}.py`;
            command = (dir, fn, inputFn) =>
                `docker run --rm --network none --memory=256m --cpus=1 -v "${dir}:/code" python:3.12 sh -c "python /code/${fn} < /code/${inputFn}"`;
            break;

        case "c":
            filename = `code-${Date.now()}.c`;
            command = (dir, fn, inputFn) =>
                `docker run --rm --network none --memory=256m --cpus=1 -v "${dir}:/code" gcc:13 sh -c "gcc /code/${fn} -o /code/main && /code/main < /code/${inputFn}"`;
            break;

        case "cpp":
            filename = `code-${Date.now()}.cpp`;
            command = (dir, fn, inputFn) =>
                `docker run --rm --network none --memory=256m --cpus=1 -v "${dir}:/code" gcc:13 sh -c "g++ /code/${fn} -o /code/main && /code/main < /code/${inputFn}"`;
            break;

        case "java":
            filename = "Main.java";
            command = (dir, fn, inputFn) =>
                `docker run --rm --network none --memory=256m --cpus=1 -v "${dir}:/code" eclipse-temurin:21-jdk sh -c "javac /code/Main.java && java -cp /code Main < /code/${inputFn}"`;
            break;

        default:
            throw new Error("Unsupported Language");
    }

    const tempDir = path.join(__dirname, "../temp");
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const formattedTempDir = tempDir.replace(/\\/g, "/");
    const inputFile = `input-${Date.now()}.txt`;
    const filepath = path.join(tempDir, filename);
    const inputPath = path.join(tempDir, inputFile);

    fs.writeFileSync(filepath, code);
    fs.writeFileSync(inputPath, input);

    const dockerCommand = command(formattedTempDir, filename, inputFile);

    return new Promise((resolve, reject) => {
        exec(dockerCommand, { timeout: 10000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            if (fs.existsSync(filepath)) {
                try { fs.unlinkSync(filepath); } catch {}
            }
            if (fs.existsSync(inputPath)) {
                try { fs.unlinkSync(inputPath); } catch {}
            }

            if (error) {
                if (error.killed) {
                    const err = new Error("Program exceeded the time limit.");
                    err.type = "Time Limit Exceeded";
                    return reject(err);
                }

                const message = stderr || error.message;
                const err = new Error(message);

                if (
                    message.includes("error:") ||
                    message.includes("SyntaxError") ||
                    message.includes("javac") ||
                    message.includes("compilation terminated")
                ) {
                    err.type = "Compilation Error";
                } else {
                    err.type = "Runtime Error";
                }

                return reject(err);
            }

            resolve(stdout);
        });
    });
};

module.exports = { runCode };