'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var db = require('../db');


module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    var dbQuery = `SELECT tweets.id as id, users.name as name,
                          tweets.content as text, users.picture_url as picture_url
                   FROM users JOIN tweets ON users.id = tweets.user_id`;
    if (req.query.search) {
      dbQuery = `SELECT tweets.id as id, users.name as name,
                        tweets.content as text, users.picture_url as picture_url
                 FROM users JOIN tweets on users.id = tweets.user_id
                 WHERE tweets.content LIKE '%${req.query.search}%'`;
    }
    db.query(dbQuery, function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows.reverse();
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets,
        showForm: true
      });
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    db.query(`SELECT tweets.id as id, users.name as name, tweets.content as text,
                     users.picture_url as picture_url
              FROM users JOIN tweets ON users.id = tweets.user_id
              AND users.name = $1`, [req.params.username], function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets,
        showForm: true,
        username: req.params.username
      });
    });
  });

  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    db.query(`SELECT tweets.id as id, users.name as name,
                     tweets.content as text, users.picture_url as picture_url
              FROM users JOIN tweets on users.id = tweets.user_id
              AND tweets.id = $1`, [req.params.id], function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows;
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets
      });
    });
  });

  // create a new tweet
  router.post('/tweets', function(req, res, next){
    db.query('INSERT INTO tweets (user_id, content) VALUES ((SELECT id FROM users WHERE name=$1),$2) RETURNING *', [req.body.name, req.body.text], function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweet = result.rows[0];
      var newTweet = {
        id: tweet.id,
        name: req.body.name,
        text: tweet.content
      };
      io.sockets.emit('new_tweet', newTweet);
      res.redirect('/');
    });
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
