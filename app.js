var express = require('express');
var engine = require('ejs-locals');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
var app = express();
var user = require('./routes/user');
var answer = require('./routes/answer');
var question = require('./routes/question');
var comment = require('./routes/comment');
var dbsystem = require('./db');

app.engine('ejs', engine);
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(expressValidator({
 customValidators: {
    isSame: function(params,value) {
      if(params!=value){
        return false;
      }
      else{
        return true;
      }
    }
 }
}));
app.use("/", express.static(__dirname + "/"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(session({
  cookie:{maxAge: 1000 * 60 * 60 * 6},
  secret:'secret',
  resave:true,
  saveUninitialized:true,
}));

app.use(function(req, res, next) {
  if(req.cookies.isLogin){
    var userid = req.cookies.id;
    var db = new dbsystem();
    if(req.cookies.status < 2){
      db.select().field(["u.*","s.hobby","s.oneword","s.adv","s.disadv","s.person","s.account","s.address","(SELECT COUNT(*) FROM question WHERE question.user_id = u.id ) AS qmt"]).from("user u").join("student s").where("s.user_id=u.id").where("u.id=",userid).run(function(users){
        req.user = users[0];
        db=null;
        delete db;
        next();
      });
    }
    else {
      db.select().field(["u.*","t.avatar","t.grade"]).from("user u").join("teacher t").where("t.user_id=u.id").where("u.id=",userid).run(function(users){
        req.user = users[0];
        db=null;
        delete db;
        next();
      });
    }
  }
  else {
    next();
  }
});

app.use('/user',user);
app.use('/answer',answer);
app.use('/question',question);
app.use('/comment',comment);

app.get("/",function(req,res){
  if(req.user){
    if(req.user.status<1){
      res.redirect("/user/notice");
    }
    else{
      res.redirect("/question/");
    }
  }else{
    res.render("index",{
      'user':req.user
    });
  }
});

app.get("/privacy",function(req,res){
  res.render("privacy",{
    'user':req.user
  })
});

app.get("/faq",function(req,res){
  res.render("faq",{
    'user':req.user
  })
});

app.listen(3000, function() {
  console.log('Server listening on port 3000!');
});
