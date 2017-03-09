'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var db = require('../db');


module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){
    // var allTheTweets = tweetBank.list();

    db.query('select tweets.id as id, users.name as name, tweets.content as text from users join tweets on users.id = tweets.user_id', function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweets = result.rows.reverse();
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets,
        showForm: true
      });
      // return tweets;
    });
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);
  router.get('/tweets', respondWithAllTweets);

  // single-user page
  router.get('/users/:username', function(req, res, next){
    db.query('select tweets.id as id, users.name as name, tweets.content as text from users join tweets on users.id = tweets.user_id and users.name = $1', [req.params.username], function (err, result) {
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
    db.query('select tweets.id as id, users.name as name, tweets.content as text from users join tweets on users.id = tweets.user_id and tweets.id = $1', [req.params.id], function (err, result) {
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
    db.query('INSERT INTO tweets (user_id, content) VALUES ((SELECT id from users where name=$1),$2) RETURNING *', [req.body.name, req.body.text], function (err, result) {
      if (err) return next(err); // pass errors to Express
      var tweet = result.rows[0];
      var newTweet = {
        id: tweet.id,
        name: req.body.name,
        text: tweet.content
      };
      console.log(result)
      // var tweets = result.rows;

      io.sockets.emit('new_tweet', newTweet);
      res.redirect('/');
      // res.render('index', {
      //   title: 'Twitter.js',
      //   tweets: tweets
      // });
    });
    // var newTweet = tweetBank.add(req.body.name, req.body.text);
    // io.sockets.emit('new_tweet', newTweet);
    // res.redirect('/');
  });

  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
