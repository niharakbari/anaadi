const bcrypt = require("bcrypt");
const config = require("../config/config");

(async () => {
    const password = config.admin.password; // Change this once

    console.log(config.admin.password);

    const hash = await bcrypt.hash(password, 10);

    console.log(hash);
})();