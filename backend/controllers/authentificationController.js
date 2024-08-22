const { validate } = require("uuid");
const AuthentificationModel = require("../models/authentificationModel");
const tokenService = require('./../services/tokenService')
const databaseModel = require('./../models/databaseModel')

const AuthentificationController = {
    registerUser: async(req, res, AuthentificationModel) =>
    {
        const { username, password, confirmPassword } = req.body.data;
        AuthentificationModel.registerUser(username, password, confirmPassword, (err, response) => {
            if (err) return res.status(500).json({ error: err.message });
            if(response != -1)
            {
                return res.json(tokenService.createToken(response));
            }
            else
            {
                return res.json(-1);
            }
        });
    },

    loginUser: async(req, res, AuthentificationModel) =>
    {
        const { username, password } = req.body.data;
        AuthentificationModel.loginUser(username, password, (err, response) => {
            if (err) return res.status(500).json({ error: err.message });
            if(response != -1)
                {
                    return res.json(tokenService.createToken(response));
                }
                else
                {
                    return res.json(-1);
                }
        });
    },

    userInfo: async (req, res) => {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: "Authorization token is required" });
            }
    
            // Verify the token
            const jwtResult = tokenService.verifyToken(token);
            if (!jwtResult) {
                return res.status(401).json({ error: "Invalid JWT" });
            }
    
            await databaseModel.createProfileTable();
    
            const user = await databaseModel.getUserById(jwtResult.data);

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
    
            delete user.password;
            
            const userQuestions = await databaseModel.findProfile(user.username);
    
            res.json({ user, userQuestions });
        } catch (err) {
            console.error('Error fetching user info:', err);
            return res.status(500).json({ error: err.message });
        }
    },
    

    validateJWT: async(req, res, AuthentificationModel) =>
    {
        const token = req.headers.authorization;
        AuthentificationModel.validateJWT(token, (err, response) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(response);
        });
    }
}


module.exports = AuthentificationController;
