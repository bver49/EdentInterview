var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var dbsystem = require('../db');
var mailer = require('../email');

//For avatar upload
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function(req, file, cb) {
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

var upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

//算天差
function days_between(d1, d2) {
  var date1 = new Date(d1);
  var date2 = new Date(d2);
  var ONE_DAY = 1000 * 60 * 60 * 24;
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();
  var difference_ms = Math.abs(date1_ms - date2_ms);
  return Math.round(difference_ms / ONE_DAY);
}

router.get('/', function(req, res) {
  if (req.user) {
    res.redirect("/question/");
  } else {
    res.redirect("/");
  }
});

//註冊
router.get('/signup', function(req, res) {
  if (req.user) {
    res.redirect("/question/");
  } else {
    res.render('user/signup', {
      'user': null,
      'title':"註冊醫甸面試"
    });
  }
});

//新增老師
router.get('/addTeacher', function(req, res) {
  if (!req.user || req.user.status != 3) {
    res.redirect("/question/");
  } else {
    res.render('user/createTeacher', {
      'user': req.user
    });
  }
});

//創建學生
router.post('/create', function(req, res) {
  req.checkBody('email', 'Email不可為空').notEmpty();
  req.checkBody('email', 'Email格式錯誤').isEmail();
  req.checkBody('pw', '密碼不可為空').notEmpty();
  req.checkBody('pw', '密碼需大於6碼').len(6);
  req.checkBody('pw', '密碼不一致').isSame(req.body.pw2);
  var errors = req.validationErrors();
  if (errors) {
    console.log(errors);
    res.send(errors);
  } else {
    var data = {
      email: req.body.email.replace(/\'|\#|\/\*/g, ""),
      pw: req.body.pw.replace(/\'|\#|\/\*/g, "")
    }
    var db = new dbsystem();
    db.insert().into("user").set(data).run(function(result, err) {
      if (err && err.code == "ER_DUP_ENTRY") {
        res.send("Dup");
      } else {
        var data = {
          user_id: result.insertId
        }
        db.insert().into("student").set(data).run(function(result, err) {
          db = null;
          delete db;
          mailer.signup(req.body.email);
          res.send("Success");
        });
      }
    })
  }
});

//創建老師
router.post('/create_t', function(req, res) {
  req.checkBody('email', 'Email不可為空').notEmpty();
  req.checkBody('email', 'Email格式錯誤').isEmail();
  req.checkBody('pw', '密碼不可為空').notEmpty();
  req.checkBody('pw', '密碼需大於6碼').len(6);
  req.checkBody('pw', '密碼不一致').isSame(req.body.pw2);
  var errors = req.validationErrors();
  if (errors) {
    console.log(errors);
    res.send(errors);
  } else {
    var data = {
      email: req.body.email.replace(/\'|\#|\/\*/g, ""),
      pw: req.body.pw.replace(/\'|\#|\/\*/g, ""),
      status: req.body.status
    }
    var db = new dbsystem();
    db.insert().into("user").set(data).run(function(result, err) {
      if (err && err.code == "ER_DUP_ENTRY") {
        res.send("Dup");
      } else {
        var data = {
          user_id: result.insertId
        }
        db.insert().into("teacher").set(data).run(function(result, err) {
          db = null;
          delete db;
          res.send("Success");
        });
      }
    })
  }
});

//登入頁面
router.get('/login', function(req, res) {
  if (req.user) {
    res.redirect("/question/");
  } else {
    res.render('user/login', {
      'user': req.user,
      'title': "登入醫甸面試"
    });
  }
});

//登入驗證
router.post('/auth', function(req, res) {
  var email = req.body.email.replace(/\'|\#|\/\*/g, "");
  var pw = req.body.pw.replace(/\'|\#|\/\*/g, "");
  var db = new dbsystem();
  db.select().field("*").from("user").where("email=", email).run(function(user) {
    if (user.length > 0) {
      user = user[0];
      if (pw == user.pw) {
        res.cookie('isLogin',1,{maxAge: 60 * 60 * 1000});
        res.cookie('id', user.id,{maxAge: 60 * 60 * 1000});
        res.cookie('status', user.status,{maxAge: 60 * 60 * 1000});
        //學生:尚未開通
        if (user.status < 1) {
          res.send("No_auth");
        } else {
          //學生:沒填資料
          if (user.status == 1 && user.edit == 0) {
            res.send("Edit");
          }
          //老師:沒填資料
          else if (user.status == 2 && user.edit == 0) {
            res.send("Edit_t");
          }
          //管理者/老師/學生:資料完整
          else {
            res.send("Success");
          }
        }
      }
      //密碼錯誤
      else {
        res.send("Pw_err");
      }
    }
    //找不到用戶
    else {
      res.send("No_user");
    }
    db = null;
    delete db;
  });
});

//編輯頁面
router.get('/edit', function(req, res) {
  if (!req.user) {
    res.redirect("/");
  } else {
    res.render('user/edit', {
      'user': req.user,
      'status': 0,
      'notify':(req.query.upload)?1:0
    });
  }
});

router.get('/editA', function(req, res) {
  if (!req.user || req.user.status !=1 ) {
    res.redirect("/");
  } else {
    res.render('user/edit', {
      'user': req.user,
      'status': 1,
      'title': '恭喜你驗證成功，在此完善你的資料吧'
    });
  }
});

router.get('/editB', function(req, res) {
  if (!req.user || req.user.status !=1 ) {
    res.redirect("/");
  } else {
    res.render('user/edit', {
      'user': req.user,
      'status': 2,
      'title': '恭喜你驗證成功，在此完善你的資料吧'
    });
  }
});

router.get('/editC', function(req, res) {
  if (!req.user || req.user.status !=1 ) {
    res.redirect("/");
  } else {
    res.render('user/edit', {
      'user': req.user,
      'status': 3,
      'title': '恭喜你驗證成功，在此完善你的資料吧'
    });
  }
});

router.get('/editD', function(req, res) {
  if (!req.user || req.user.status !=2 ) {
    res.redirect("/");
  } else {
    res.render('user/edit', {
      'user': req.user,
      'status': 4
    });
  }
});

router.get('/editE', function(req, res) {
  if (!req.user || req.user.status !=2 ) {
    res.redirect("/");
  } else {
    res.render('user/edit', {
      'user': req.user,
      'status': 5
    });
  }
});

//更新資料A
router.put('/updateA', function(req, res) {
  if (!req.user) {
    res.send("Fail");
  } else {
    req.checkBody('name', '請填寫姓名').notEmpty();
    req.checkBody('gender', '請選擇性別').notEmpty();
    req.checkBody('justgraduate', '請填寫是否為應屆').notEmpty();
    req.checkBody('nowschool', '請填寫目前就讀學校').notEmpty();
    req.checkBody('address', '請填寫聯絡地址').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
      res.send(errors);
    } else {
      var data = {
        name: req.body.name.replace(/\'|\#|\/\*/g, ""),
        gender: req.body.gender,
        birth: req.body.y + "/" + req.body.m + "/" + req.body.d,
        justgraduate: req.body.justgraduate,
        nowschool: req.body.nowschool.replace(/\'|\#|\/\*/g, "")
      }
      var db = new dbsystem();
      db.update().table("user").set(data).where("id=", req.user.id).run(function(result) {
        db.update().table("student").set({address:req.body.address.replace(/\'|\#|\/\*/g,"")}).where("user_id=",req.user.id).run(function(result){
          db = null;
          delete db;
          res.send("Success");
        });
      });
    }
  }
});

//更新資料B
router.put('/updateB', function(req, res) {
  if (!req.user) {
    res.send("Fail");
  } else {
    req.checkBody('school', '請選擇報考校系').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
      res.send(errors);
    } else {
      var data = {
        school: req.body.school.toString().replace(/\'|\#|\/\*/g, "")
      }
      var db = new dbsystem();
      db.update().table("user").set(data).where("id=", req.user.id).run(function(result) {
        db = null;
        delete db;
        res.send("Success");
      });
    }
  }
});

//更新資料C
router.put('/updateC', function(req, res) {
  if (!req.user) {
    res.send("Fail");
  } else {
    req.checkBody('adv', '請填寫優點').notEmpty();
    req.checkBody('disadv', '請選擇缺點').notEmpty();
    req.checkBody('hobby', '請填寫興趣').notEmpty();
    req.checkBody('person', '請填寫個性').notEmpty();
    req.checkBody('oneword', '請以一句話形容你自己').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
      res.send(errors);
    } else {
      var data = {
        adv: req.body.adv.replace(/\'|\#|\/\*/g, ""),
        disadv: req.body.disadv.replace(/\'|\#|\/\*/g, ""),
        hobby: req.body.hobby.replace(/\'|\#|\/\*/g, ""),
        person: req.body.person.replace(/\'|\#|\/\*/g, ""),
        oneword: req.body.oneword.replace(/\'|\#|\/\*/g, "")
      }
      var db = new dbsystem();
      db.update().table("student").set(data).where("user_id=", req.user.id).run(function(result) {
        db.update().table("user").where("id=", req.user.id).set({
          edit: 1
        }).run(function(result) {
          db = null;
          delete db;
          res.send("Success");
        });
      });
    }
  }
});

//更新資料D
router.put('/updateD',upload.any(),function(req, res) {
  if (!req.user) {
    res.send("Fail");
  } else {
    var file = req.files[0];
    //需要檢查有沒有上船大頭貼
    if(req.query.check){
      req.body.files = req.files[0];
      req.checkBody('files', '請上傳大頭貼').notEmpty();
    }
    req.checkBody('name', '請填寫姓名').notEmpty();
    req.checkBody('gender', '請選擇性別').notEmpty();
    req.checkBody('grade', '請選擇年級').notEmpty();
    req.checkBody('nowschool', '請填寫目前就讀學校').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
      //有上傳頭貼卻錯誤 清除上傳的頭貼
      if(file) fs.unlink(file.path);
      res.send(errors);
    } else {
      var data = {
        name: req.body.name.replace(/\'|\#|\/\*/g, ""),
        gender: req.body.gender,
        nowschool: req.body.nowschool.replace(/\'|\#|\/\*/g, "")
      }
      var db = new dbsystem();
      db.update().table("user").set(data).where("id=", req.user.id).run(function(result) {
        db.update().table("teacher").set({grade:req.body.grade,}).where("user_id=", req.user.id).run(function(result) {
          //有上傳頭貼要更新頭貼路徑 並清除舊有的頭貼
          if(file){
            db.select().field("avatar").from("teacher").where("user_id=",req.user.id).run(function(teacher){
              fs.unlink(teacher[0].avatar);
              db.update().table("teacher").set({avatar:file.path}).where("user_id=", req.user.id).run(function(result) {
                res.send("Success");
              });
            });
          }else{
            res.send("Success");
          }
        });
      });
    }
  }
});

//更新資料E
router.put('/updateE', function(req, res) {
  if (!req.user) {
    res.send("Fail");
  } else {
    req.checkBody('school', '請選擇面試過的校系').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
      res.send(errors);
    } else {
      var data = {
        school: req.body.school.toString().replace(/\'|\#|\/\*/g, ""),
        edit: 1
      }
      var db = new dbsystem();
      db.update().table("user").set(data).where("id=", req.user.id).run(function(result) {
        db = null;
        delete db;
        res.send("Success");
      });
    }
  }
});

//提醒繳款
router.get('/notice', function(req, res) {
  if (!req.user) {
    //註冊後通知
    if (req.query.e) {
      res.render('user/notice', {
        'user': null,
        'email': req.query.e,
        'title': "註冊醫甸面試"
      });
    } else {
      res.redirect("/");
    }
  } else {
    res.render('user/notice', {
      'user': req.user,
      'title': "登入醫甸面試"
    });
  }
});

router.post('/notice', function(req, res) {
  if (!req.user) {
    res.send("Fail");
  } else {
    req.checkBody('accoutnumber', '帳戶末5碼不可為空').notEmpty();
    req.checkBody('accoutnumber', '帳戶末5碼長度錯誤').len(5);
    var errors = req.validationErrors();
    if (errors) {
      res.send(errors);
    } else {
      var db = new dbsystem();
      db.update().table("student").set({account: req.body.accoutnumber}).where("user_id=", req.user.id).run(function(result) {
        db = null;
        delete db;
        mailer.remindFinance(req.body.accoutnumber);
        res.send("Success");
      });
    }
  }
});

//忘記密碼
router.get('/forgetpw', function(req, res) {
  if (req.user) {
    res.redirect("/question/");
  } else {
    res.render('user/forgetpw', {
      'user':null
    });
  }
});

//發送重設密碼連結
router.post('/forgetpw', function(req, res) {
  if (req.user) {
    res.send("Fail");
  } else {
    var db = new dbsystem();
    db.select().field("*").from("user").where("email=",req.body.email).run(function(user){
      if(user.length > 0){
        db.update().table("user").set({changepw:1}).where("id=",user[0].id).run(function(result){
          db = null;
          delete db;
          mailer.forgetPw(user[0]);
          res.send("Success")
        });
      }else{
        res.send([{msg:"無此用戶"}]);
      }
    });
  }
});

//更改密碼
router.get('/editpw', function(req, res) {
  if (req.user || !req.query.email || !req.query.i ) {
    res.redirect("/");
  }
  else {
    var db = new dbsystem();
    db.select().field("id,changepw").from("user").where("id=",req.query.i).where("email=",req.query.email).run(function(user){
      if(user.length>0 && user[0].changepw == 1){
        res.render('user/editpw', {
          'user':null,
          'id':user[0].id
        });
      }else{
        res.redirect("/");
      }
    });
  }
});

//更改密碼
router.post('/editpw', function(req, res) {
  req.checkBody('newpw', '密碼不可為空').notEmpty();
  req.checkBody('newpw', '密碼需大於6碼').len(6);
  var errors = req.validationErrors();
  if (errors) {
    res.send(errors);
  }else{
    var db = new dbsystem();
    db.update().table("user").set({pw:req.body.newpw,changepw:0}).where("id=",req.body.id).run(function(result){
      db = null;
      delete db;
      res.send("Success")
    });
  }
});


/* 管理用戶 */
router.get('/adminuser', function(req, res) {
  if (!req.user || req.user.status != 3) {
    res.redirect("/");
  } else {
    var db = new dbsystem();
    if(req.query.s == 2){
      db.select().field(["*", "(SELECT account FROM student WHERE student.user_id = user.id ) AS account"]).from("user").where("status IN", [2]).run(function(user) {
        res.render('user/adminuser', {
          'user': req.user,
          'data': user,
          'status':req.query.s
        });
      });
    }else{
      db.select().field(["*", "(SELECT account FROM student WHERE student.user_id = user.id ) AS account"]).from("user").where("status IN",[0,1]).run(function(user) {
        res.render('user/adminuser', {
          'user': req.user,
          'data': user,
          'status':req.query.s
        });
      });
    }
  }
});

/* 刪除用戶資料 */
router.get('/del/:id', function(req, res) {
  if (!req.user || req.user.status != 3) {
    res.redirect("/");
  } else {
    var id = req.params.id;
    var db = new dbsystem();
    db.delete().from("user").where("id=",id).run(function(result) {
      db = null;
      delete db;
      res.redirect('/user/adminuser');
    });
  }
});

/* 批准用戶 */
router.get('/authorize/:id', function(req, res) {
  if (!req.user || req.user.status != 3) {
    res.redirect("/");
  } else {
    var id = req.params.id;
    var db = new dbsystem();
    db.select().field("*").from("user").where("id=",id).run(function(user){
      mailer.authorize(user[0]);
      db.update().table("user").where("id=", id).set({status:1}).run(function(result){
        db = null;
        delete db;
        res.redirect('/user/adminuser');
      });
    });
  }
});

//登出
router.get('/logout', function(req, res) {
  res.clearCookie('isLogin');
  res.clearCookie('id');
  res.redirect("/");
});

//查看會員資料
router.get('/:id', function(req, res) {
  if (!req.user || req.user.status != 3) {
    res.redirect("/");
  } else {
    var id = req.params.id;
    var status = req.query.s;
    var db = new dbsystem();
    if (status == 1 || status == 0) {
      db.select().field(["u.*", "s.hobby", "s.oneword", "s.adv", "s.disadv", "s.person", "s.account","s.address"]).from("user u").join("student s").where("s.user_id=u.id").where("u.id=", id).run(function(users) {
        res.render('user/show', {
          'user': req.user,
          'data': users[0]
        });
      });
    } else {
      db.select().field(["u.*", "t.avatar","t.grade"]).from("user u").join("teacher t").where("t.user_id=u.id").where("u.id=", id).run(function(users) {
        res.render('user/show', {
          'user': req.user,
          'data': users[0]
        });
      });
    }
  }
});

module.exports = router;
