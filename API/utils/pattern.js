// pattern.js

const USERNAME_PATTERN = /^(?=.{1,20}$)[A-Za-z0-9+_]+$/;
function validateUsername(username) {
    return username != null && USERNAME_PATTERN.test(username);
}

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
function validateUUID(uuid) {
    return uuid != null && UUID_PATTERN.test(uuid);
}

const EMAIL_PATTERN = /^[a-zA-Z0-9_\-.]+@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
function validateEmail(email) {
    return email != null && EMAIL_PATTERN.test(email);
}

module.exports = {
    validateUsername,
    validateUUID,
    validateEmail,
};