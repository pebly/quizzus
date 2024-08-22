const db = require('./databaseModel');
const tokenService = require('./../services/tokenService')

class AuthentificationModel {

    async registerUser(username, password, confirmPassword, callback) {
        try {
            if (!username || !password || !confirmPassword) {
                return callback("All fields are required", null);
            }

            if (password !== confirmPassword) {
                return callback("Passwords do not match", null);
            }

            await db.createUserTable();
            const response = await db.insertUser(username, password);

            callback(null, response);
        } catch (error) {
            callback("An error occurred during registration", null);
        }
    }

    async loginUser(username, password, callback) {
        try {
            if (!username || !password) {
                return callback("Username and password are required", null);
            }

            const user = await db.getUser(username, password);
            if (!user) {
                return callback(null, -1);
            }
            callback(null, user.id);
        } catch (error) {
            callback("An error occurred during login", null);
        }
    }

    async validateJWT(token, callback) {
        try {
            tokenService.verifyToken(token);
            callback(null, -1);
        } catch (error) {
            callback("An error occurred during validation", null);
        }
    }

    
}

module.exports = AuthentificationModel;