const bcrypt = require("bcrypt");
const config = require("../config/config");

async function hashPassword() {
    const password = config.admin.password;
    if (!password) {
        console.error("No admin password found in environment configuration.");
        return;
    }
    const hash = await bcrypt.hash(password, 10);
    console.log(hash);
}

if (require.main === module) {
    hashPassword();
}

module.exports = hashPassword;