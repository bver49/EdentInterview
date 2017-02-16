var express = require('express');
var router = express.Router();
var dbsystem = require('../db');
var mailer = require('../email');

//route auth
function checklogin() {
  return function(req, res, next) {
    if (!req.user) {
      res.redirect("/user/login");
    } else if (req.user.status < 1) {
      res.redirect("/user/notice");
    } else if (req.user.edit == 0) {
      if (req.user.status == 2) {
        res.redirect("/user/editD");
      } else {
        res.redirect("/user/editA");
      }
    } else {
      next();
    }
  }
}

//出題
function give_question(db, schoolist, questionlist, callback) {
  if (schoolist.length > 0) {
    var random_n = Math.floor(Math.random() * (schoolist.length))
    var choose_school = schoolist[random_n];
    //學生有被分配過問題了
    if (questionlist.length > 0) {
      db.select().field("*").from("exam").where("id NOT IN", questionlist).where("tag LIKE '%" + choose_school + "%'").limit(1).run(function(exam) {
        if (exam.length > 0) {
          callback(exam);
        } else {
          schoolist.splice(random_n, 1);
          give_question(db, schoolist, questionlist, callback);
        }
      });
    }
    //學生尚未有被分配問題
    else {
      db.select().field("*").from("exam").where("tag LIKE '%" + choose_school + "%'").limit(1).run(function(exam) {
        if (exam.length > 0) {
          callback(exam);
        } else {
          schoolist.splice(random_n, 1);
          give_question(db, schoolist, questionlist, callback);
        }
      });
    }
  }
  //學生所選的tag都沒題目可以挑了
  else {
    if (questionlist.length > 0) {
      db.select().field("*").from("exam").where("id NOT IN", questionlist).limit(1).run(function(exam) {
        callback(exam);
      });
    } else {
      db.select().field("*").from("exam").limit(1).run(function(exam) {
        callback(exam);
      });
    }
  }
}

/* 查看所有問題 */
router.get('/', checklogin(), function(req, res) {
  var db = new dbsystem();
  //學生
  if (req.user.status == 1) {
    db.select().field(["*", "(SELECT COUNT(*) FROM comment WHERE comment.question_id = question.id ) AS camt"]).from("question").where("user_id=", req.user.id).where("teacher_id!=", 0).run(function(question) {
      res.render('question/index', {
        'user': req.user,
        'question': question
      });
      db = null;
      delete db;
    });
  }
  //老師
  else if (req.user.status == 2) {
    db.select().field(["*", "(SELECT COUNT(*) FROM comment WHERE comment.question_id = question.id ) AS camt", "(SELECT created_at FROM answer WHERE answer.question_id = question.id ) AS answertime"]).from("question").where("teacher_id=", req.user.id).run(function(question) {
      res.render('question/index', {
        'user': req.user,
        'question': question
      });
      db = null;
      delete db;
    });
  }
  //管理員
  else {
    db.select().field(["*", "(SELECT COUNT(*) FROM comment WHERE comment.question_id = question.id ) AS camt", "(SELECT created_at FROM answer WHERE answer.question_id = question.id ) AS answertime"]).from("question").where("teacher_id !=", 0).run(function(question) {
      res.render('question/index', {
        'user': req.user,
        'question': question
      });
      db = null;
      delete db;
    });
  }
});

/* 下一題 */
router.post('/create/:id/:qlid', function(req, res) {
  if (req.user && req.user.status == 1 && req.user.qmt <= 12 && req.params.id && req.params.qlid) {
    var db = new dbsystem();
    //挑出一位老師
    db.select().field(["id", "name", "email", "(SELECT COUNT(*) FROM question WHERE question.teacher_id = user.id ) AS qmt"]).from("user").where("status=2").order("qmt").order("id").limit(1).run(function(teacher) {
      db.select().field(["id", "content"]).from("question").where("id=", req.params.id).run(function(question) {
        mailer.noticeTeacher(req.user, teacher[0], question[0]);
        //將狀態更新為學生已回答分配老師
        var data = {
          teacher_id: teacher[0].id,
          teacher_name: teacher[0].name,
          status: 1
        }
        db.update().table("question").set(data).where("id=", req.params.id).run(function(result) {
          db.update().table("questionlist").set({skip: 1}).where("id=", req.params.qlid).run(function(result) {
            db.select().field("*").from("questionlist").where("user_id=", req.user.id).where("skip=", 1).run(function(questionlist) {
              var list = [];
              for (var i in questionlist) {
                list.push(questionlist[i].exam_id);
              }
              var school = req.user.school.split(",");
              //篩選題目
              give_question(db, school, list, function(exam) {
                if (exam.length > 0) {
                  var data = {
                    exam_id: exam[0].id,
                    user_id: req.user.id
                  }
                  db.insert().into("questionlist").set(data).run(function(result) {
                    var data = {
                      content: exam[0].content,
                      tag: exam[0].tag,
                      user_id: req.user.id,
                      questionlist_id: result.insertId
                    }
                    db.insert().into("question").set(data).run(function(result) {
                      db = null;
                      delete db;
                      res.send("Success");
                    });
                  });
                } else {
                  res.send("Fail");
                }
              });
              // 篩選題目END
            });
          });
        })
      });
    });
  } else {
    res.send("Fail");
  }
});

/* 跳過一題 */
router.post('/skipq/:id/:qlid', function(req, res) {
  if (req.user && req.user.status == 1 && req.user.qmt <= 12 && req.params.id && req.params.qlid) {
    var db = new dbsystem();
    db.update().table("questionlist").set({skip: 1}).where("id=", req.params.qlid).run(function() {
      db.delete().from("question").where("id=", req.params.id).run(function() {
        db.select().field("*").from("questionlist").where("user_id=", req.user.id).where("skip=",1).run(function(questionlist) {
          var list = [];
          for (var i in questionlist) {
            list.push(questionlist[i].exam_id);
          }
          var school = req.user.school.split(",");
          give_question(db, school, list, function(exam) {
            if (exam.length > 0) {
              var data = {
                exam_id: exam[0].id,
                user_id: req.user.id
              }
              db.insert().into("questionlist").set(data).run(function(result) {
                var data = {
                  content: exam[0].content,
                  tag: exam[0].tag,
                  user_id: req.user.id,
                  questionlist_id: result.insertId
                }
                db.insert().into("question").set(data).run(function(result) {
                  db = null;
                  delete db;
                  res.send("Success");
                });
              });
            } else {
              res.send("Fail");
            }
          });
        });
      });
    });
  } else {
    res.send("Fail");
  }
});

/* 回答問題 */
router.get('/answer', checklogin(), function(req, res) {
  if (req.user.status != 1) {
    res.redirect("../");
  }
  // 剛驗證完尚未有題目
  else if (req.user.qmt == 0) {
    var db = new dbsystem();
    db.select().field("*").from("questionlist").where("user_id=", req.user.id).where("skip=", 1).run(function(questionlist) {
      var list = [];
      for (var i in questionlist) {
        list.push(questionlist[i].exam_id);
      }
      var school = req.user.school.split(",");
      give_question(db, school, list, function(exam) {
        if (exam.length > 0) {
          var data = {
            exam_id: exam[0].id,
            user_id: req.user.id
          }
          db.insert().into("questionlist").set(data).run(function(result) {
            var data = {
              content: exam[0].content,
              tag: exam[0].tag,
              user_id: req.user.id,
              questionlist_id: result.insertId
            }
            db.insert().into("question").set(data).run(function(result) {
              db = null;
              delete db;
              res.redirect("/question/answer");
            });
          });
        } else {
          res.redirect("/question/");
        }
      });
    });
  } else {
    var db = new dbsystem();
    //有分配到題目了 找出最新的一題
    db.select().field("*").from("question").where("user_id=", req.user.id).where("teacher_id=", 0).order("created_at", false).run(function(question) {
      if (question.length > 0) {
        db.select().field("*").from("answer").where("question_id=", question[0].id).run(function(answer) {
          res.render('question/answer', {
            'user': req.user,
            'question': question[0],
            'answer': answer,
            'notify': (req.query.upload) ? 1 : 0
          });
          db = null;
          delete db;
        });
      } else {
        res.redirect("/question/");
      }
    });
  }
});

//瀏覽題庫
router.get('/view', checklogin(), function(req, res) {
  var db = new dbsystem();
  db.select().field(["id", "content"]).from("exam").run(function(question) {
    res.render('question/view', {
      'user': req.user,
      'question': question
    });
  });
});

/* 查看問題內容 */
router.get('/:id', checklogin(), function(req, res) {
  var db = new dbsystem();
  db.select().field("*").from("question").where("id=", req.params.id).run(function(question) {
    if (question.length > 0) {
      if ((question[0].status == 2 && req.user.status == 1) || (question[0].status == 1 && req.user.status == 2)) {
        //將狀態更新為老師或學生已讀
        db.update().table("question").set({
          status: 0
        }).where("id=", req.params.id).run(function(result) {});
      }
      //題目屬於該學生
      if (question[0].user_id == req.user.id) {
        //找出負責該題目的老師的資料
        db.select().field(["u.id", "u.name", "u.email", "u.gender", "u.school", "u.nowschool", "t.avatar"]).from("user u").join("teacher t").where("t.user_id=u.id").where("u.id=", question[0].teacher_id).run(function(teacher) {
          //找出老師的回復
          db.select().field("*").from("comment").where("question_id=", question[0].id).run(function(comment) {
            //找出學生的答案
            db.select().field("*").from("answer").where("question_id=", question[0].id).run(function(answer) {
              db = null;
              delete db;
              res.render('question/show', {
                'user': req.user,
                'question': question[0],
                'comment': comment,
                'answer': answer[0],
                'teacher': teacher[0]
              });
            });
          });
        });
      }
      //題目屬於該老師 或管理員
      else if (question[0].teacher_id == req.user.id || req.user.status == 3) {
        db.select().field(["u.id", "u.name", "u.email", "u.gender", "u.school", "u.nowschool", "u.justgraduate", "s.hobby", "s.oneword", "s.adv", "s.disadv", "s.person", "s.account", "(SELECT COUNT(*) FROM question WHERE question.user_id = u.id ) AS qmt"]).from("user u").join("student s").where("s.user_id=u.id").where("u.id=", question[0].user_id).run(function(student) {
          db.select().field("*").from("comment").where("question_id=", question[0].id).run(function(comment) {
            db.select().field("*").from("answer").where("question_id=", question[0].id).run(function(answer) {
              db = null;
              delete db;
              res.render('question/show', {
                'user': req.user,
                'question': question[0],
                'comment': comment,
                'answer': answer[0],
                'student': student[0]
              });
            });
          });
        });
      } else {
        db = null;
        delete db;
        res.redirect("../");
      }
    } else {
      res.redirect("/question/");
    }
  });
});

module.exports = router;
