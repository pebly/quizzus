const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const secretKey = 'a1ef4b092c4771bfbf393efee946a3a91287c12b24cc69c96f02100bc23b5ca0d119da8639376a97b90c85fdb7a957689796a5ae4d34c1ace802fe78824ca07f';

const createToken = (payload) => {
    try {
        return jwt.sign({
            data: payload
          }, secretKey, { expiresIn: 60 * 60 * 10});
    } catch (e) {
        console.error('Error creating token:', e);
        return null;
    }
};


const verifyToken = (token) => {
    try {
        if (token && token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }
        return jwt.verify(token, secretKey);
    } catch (err) {
        return null;
    }
};

module.exports = {
    createToken,
    verifyToken
};