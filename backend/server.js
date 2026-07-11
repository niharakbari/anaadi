console.log("1. server.js started");

const app = require("./app");

console.log("2. app imported");

const config = require("./src/config/config");

console.log("3. config:", config);


console.log("4. Before listen");

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});

console.log("6. After listen");