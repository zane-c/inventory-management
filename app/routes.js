const express = require('express');
const SqlString = require('sqlstring');
const router = express.Router();
const db = require('./database');

const sendQuery = (query, res, statusOnly) => {
  db.query(query, (err, result) => {
    if (!err) {
      if (!statusOnly) {
        res.json(result);
      } else {
        res.sendStatus(200);
      }
    } else {
      res.sendStatus(500);
    }
  });
};

// TODO: escape user input to prevent SQL INJECTION
const buildQueryString = (clauses) => {
  clauses = clauses.filter(i => !!i.data);
  if (clauses.length === 0)
    return '';

  var output = 'WHERE';
  clauses.forEach(i => {
    output += ` ${i.column}="${i.data}" AND`;
  });
  return output.slice(0, -4);
};

/* 
Retreives a list of unique items by serial_id 
  Params: (optional)
  - serial_num 

  Query Params: (optional)
  - status 
  - location
  - item_id
*/
router.route('/items').get((req, res) => {
  const clauses = [
    { column: 'status', data: req.query.status },
    { column: 'location', data: req.query.location },
    { column: 'item_id', data: req.query.item_id },
  ];
  
  const query = `SELECT * FROM inventory ${buildQueryString(clauses)}`;
  sendQuery(query, res);
});

router.route('/items').get((req, res) => {
  const clauses = [
    { column: 'serial_num', data: req.params.serial_num },
    { column: 'status', data: req.query.status },
    { column: 'location', data: req.query.location },
    { column: 'item_id', data: req.query.item_id },
  ];
  
  const query = `SELECT * FROM inventory ${buildQueryString(clauses)}`;
  sendQuery(query, res);
});

/*
Retreives a list of items grouped by item_id
  Params: (optional)
  - item_id 

  Query Params: (optional)
  - status 
  - location
*/
router.route('/stock').get((req, res) => {
  const clauses = [
    { column: 'status', data: req.query.status },
    { column: 'location', data: req.query.location },
  ];
  
  const query = `SELECT *, count(*) as Quantity FROM inventory ${buildQueryString(clauses)} GROUP BY item_id`;
  sendQuery(query, res);
});

router.route('/stock/:item_id').get((req, res) => {
  const clauses = [
    { column: 'item_id', data: req.params.item_id },
    { column: 'status', data: req.query.status },
    { column: 'location', data: req.query.location },
  ];
  
  const query = `SELECT *, count(*) as Quantity FROM inventory ${buildQueryString(clauses)} GROUP BY item_id`;
  sendQuery(query, res);
});

/*
Retreives the history of a specific item
  Params: (required)
  - serial_num 
*/
router.route('/history/:serial_num').get((req, res) => {
  const clauses = [{ column: 'serial_num', data: req.params.serial_num }];
  const query = `SELECT * FROM transactions ${buildQueryString(clauses)}`;
  sendQuery(query, res);
});

/*
Places a specific item into a user's cart
  Params: (required)
  - serial_num 

  Query Params: (required)
  - user_id 
*/
router.route('/checkout/:serial_num').post((req, res) => {
  const clauses = [{ column: 'serial_num', data: req.params.serial_num }];
  const user_id = req.query.user_id;
  if (!req.params.serial_num || !req.query.user_id)
    return res.sendStatus(500);
  const query = `UPDATE inventory set status="checkedout", checked_out="${user_id}" ${buildQueryString(clauses)}`;
  sendQuery(query, res, true);
});

/*
Gets all items that are checked out by user
  Query Params: (required)
  - user_id 
*/
router.route('/checkout/').get((req, res) => {
  const clauses = [{ column: 'checked_out', data: req.query.user_id }];
  if (!req.query.user_id)
    return res.sendStatus(500);
  const query = `SELECT * FROM inventory ${buildQueryString(clauses)}`;
  sendQuery(query, res);
});

/*
Withdraws from inventory
  Params: (required)
  - serial_num 

  Query Params: (required)
  - location 
*/
router.route('/withdraw/:serial_num').post((req, res) => {
  const clauses = [{ column: 'serial_num', data: req.params.serial_num }];
  const location = req.query.location;
  const query1 = `UPDATE inventory set status="inhome", checked_out="", withdraw_date=${new Date().getTime()} ${buildQueryString(clauses)};`;
  const query2 = `INSERT INTO transactions VALUES ("${req.params.serial_num}", "withdraw", "${location}", ${new Date().getTime()});`;
  db.query(query1, () => null);
  db.query(query2, (err, result) => {
    if (!err) {
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  });
});

/*
Deposists into inventory
  Params: (required)
  - serial_num 
*/
router.route('/deposit/:serial_num').post((req, res) => {
  const clauses = [{ column: 'serial_num', data: req.params.serial_num }];
  const query1 = `UPDATE inventory set status="inventory", deposit_date=${new Date().getTime()} ${buildQueryString(clauses)};`;
  const query2 = `INSERT INTO transactions VALUES ("${req.params.serial_num}", "deposit", "inventory", ${new Date().getTime()});`;
  db.query(query1, () => null);
  db.query(query2, (err, result) => {
    if (!err) {
      res.sendStatus(200);
    } else {
      res.sendStatus(500);
    }
  });
});

module.exports = router;
