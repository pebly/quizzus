const db = require('./../database');
const crypto = require('crypto');

class DatabaseModel {
    static createUserTable = () => {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                password TEXT NOT NULL
            )`);
        });
    }

    static createProfileTable = () => {
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL, 
                question TEXT,
                answer TEXT,
                isCorrect INT,
                response TEXT
            )`);
        });
    }

    static insertUser = async (email, password) => {
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                db.get(`SELECT * FROM users WHERE username = ?`, [email], (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (row) {
                        resolve(-1);
                    } else {
                        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [email, crypto.createHash('sha256').update(password).digest('hex')], function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(this.lastID);
                            }
                        });
                    }
                });
            });
        });
    }

    static getUser = async (email, password) => {
        return new Promise((resolve, reject) => {
            const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
            db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [email, hashedPassword], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    static getUserById = async (id) =>
    {
        return new Promise((resolve, reject) => {
            db.get(`SELECT * FROM users WHERE id = ?`, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    static findProfile = async (username) => {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT questions.*
                FROM questions
                JOIN users ON questions.user_id = users.id
                WHERE users.username = ?
            `;
            db.all(query, [username], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    static insertQuestion = async (id, questionData, answer) =>
    {
        return new Promise((resolve, reject) => {
            db.run(`INSERT INTO questions (user_id, question, answer) VALUES (?, ?, ?)`, [id, JSON.stringify(questionData), JSON.stringify(answer)], function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            });
        });
    }
}

module.exports = DatabaseModel;