const mysql = require('mysql');

module.exports = (app) => {
    return new Promise((resolve, reject) => {
        const con = {
            host: process.env.db_host,
            port: process.env.db_port,
            user: process.env.db_user,
            password: process.env.db_password,
            database: process.env.db_database
        };

        let connection = mysql.createConnection(con);

        connection.connect(function (err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                throw new Error(err);
                return;
            }
            connection.generateUID = async () => {
                let pattern = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz-_"
                let UID = 'UID'
                while ((await connection.query(`SELECT * FROM 'UID' WHERE md5 = ?`, [UID]))) {
                    UID = ""
                    for (let i = 0; i < 8; i++) {
                        UID += pattern[Math.floor(Math.random() * pattern.length)];
                    }
                }

                return UID
            }
            console.log('Connected to db as id ' + connection.threadId);
            resolve(connection);
        });

    });
}