// mariadb.js

const { mariadb } = require('../config.json');
const mysql = require('mysql2');

const connection = mysql.createPool({
    host: mariadb.host,
    user: mariadb.user,
    password: mariadb.pass,
    database: mariadb.db,
    connectionLimit: 10 // Maximum number of connections in the pool
})

function runQuery(sql, values) {
    return new Promise((resolve, reject) => {
        connection.getConnection((err, conn) => {
            if (err) {
                reject(err);
                return;
            }

            conn.query(sql, values, (err, results) => {
                conn.release();
                if (err) {
                    reject(err);
                    return;
                }

                resolve(results);
            });
        });
    });
}

module.exports = {
    runQuery
};