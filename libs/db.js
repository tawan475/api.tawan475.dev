const sqlite3 = require('sqlite3');

module.exports = (app, dbpath) => {
    app.db = new sqlite3.Database(dbpath, (err) => {
        if (err) {
            console.error(err.message);
            process.exit(1);
        }
        console.log(`[${Date.now()}] Connected to the database.`);
    });
}