var express = require('express');
var router = express.Router();
var dbsystem = require('../db');
var mailer = require('../email');

/* 老師回饋 */
router.post('/create', function(req, res) {
  req.checkBody('content', '回覆需大於200字').len(200);
  var errors = req.validationErrors();
  if (errors) {
    res.send(errors);
  } else {
    var data = {
      content: req.body.content,
      question_id: req.body.question_id,
      user_id: req.user.id
    }
    var db = new dbsystem();
    db.insert().into("comment").set(data).run(function(result) {
      //將狀態更新為老師已回覆
      db.update().table("question").set({status: 2}).where("id=", req.body.question_id).run(function(result) {
        db.select().field(["id","content","user_id"]).from("question").where("id=", req.body.question_id).run(function(question){
          db.select().field(["name","email"]).from("user").where("id=",question[0].user_id).run(function(user){
            mailer.noticeStudent(user[0],req.user,req.body.content,question[0]);
            db = null;
            delete db;
            res.send('Success');
          });
        });
      });
    })
  }
});

//學生評價
router.post('/rate/:cid', function(req, res) {
  req.checkBody('rate', '請給予評價').notEmpty();
  req.checkBody('suggest','請給予回饋').notEmpty();
  var errors = req.validationErrors();
  if (errors) {
    res.send(errors);
  } else {
    var data = {
      rate: req.body.rate,
      suggest: req.body.suggest
    }
    var db = new dbsystem();
    db.update().table("comment").set(data).where("id=",req.params.cid).run(function(result) {
      db = null;
      delete db;
      res.send('Success');
    })
  }
});

module.exports = router;
