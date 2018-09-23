const mysql = require('mysql');

const connection = mysql.createPool({
  connectionLimit: 100,
  host: "localhost",
  user: "",
  password: "",
  database: ""
});

module.exports = connection;
