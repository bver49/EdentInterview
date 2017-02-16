var express = require('express');
var router = express.Router();
var dbsystem = require('../db');
var config = require('../config');
var path = require('path')
//For file upload
var multer = require('multer');
var multerS3 = require('multer-s3');
var AWS = require('aws-sdk');

AWS.config.update({
  region: 'ap-northeast-1',
  accessKeyId:config.accessKeyId,
  secretAccessKey:config.secretAccessKey
});

var s3 = new AWS.S3();

var upload = multer({
  storage: multerS3({
    s3: s3,
    acl: 'public-read',
    bucket: 'edent',
    key: function(req, file, cb) {
      cb(null,req.user.id+"_"+new Date().getTime()+path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 800 * 1024 * 1024
  }
});

/* 上傳檔案 */
router.post("/upload", upload.any(), function(req, res) {
  var file = req.files[0];
  var db = new dbsystem();
  var data = {
    url: file.location,
    question_id: req.body.question_id,
    user_id: req.user.id,
    awskey: file.key
  }
  db.insert().into("answer").set(data).run(function(result) {
    db = null;
    delete db;
    res.send('Success');
  });
});

/* 刪除檔案 */
router.post("/delete", function(req, res) {
  var awskey = req.body.awskey;
  var aid = req.body.aid;
  var s3 = new AWS.S3({
    params: {
      Bucket: 'edent'
    }
  });

  var params = {
    Bucket: 'edent',
    Key: awskey
  };

  s3.deleteObject(params, function(err, data) {
    if (err) console.log(err);
    console.log('delete ' + awskey + ' done.');
    var db = new dbsystem();
    db.delete().from("answer").where("id=", aid).run(function(result) {
      db = null;
      delete db;
      res.send("Success");
    });
  });
});

module.exports = router;
