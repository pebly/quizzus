const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFilePath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbFilePath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

module.exports = db;