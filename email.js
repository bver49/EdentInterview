//For email
var config = require('./config');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'zoho',
  auth: {
    user: config.zohoid,
    pass: config.zohopw
  }
});

exports.signup = function signup(email){
  var html = "\
  <body style='color:black;'>\
    <p style='color:black;'>**此為自動發送信箱，請勿直接回覆**</p>\
    <p style='color:black;'>親愛的同學您好，</p>\
    <p style='color:black;'>歡迎您加入醫甸面試的大家庭！在這裡，我們有全台多家醫學院校的學長姐為您解答，\
    增強您的面試能力，讓您戰勝醫學系、牙醫系的面試大魔王。醫甸面試團隊已經收到您的註冊資料，\
    為了完成註冊，請您於「3天內」依序完成以下兩件事：</p>\
    <p style='color:black;'>1.匯款：將 3600元轉入本團隊帳戶：\
    <p style='color:black;'>銀行：中國信託</p>\
    <p style='color:black;'>帳號：234540216706</p>\
    <p style='color:black;'>戶名：醫甸園科技股份有限公司</p>\
    <p style='color:black;'>您可以使用您在地的ATM進行轉帳，並請保留交易明細表。</p>\
    <p style='color:black;'>2.輸入帳號末四碼：登入醫甸面試官網，\
    輸入剛剛用來轉帳的帳號末四碼（轉出帳號末四碼），\
    輸入後，我們將以人工進行審核，盡快為您開通帳號、完成註冊。</p>\
    <br>\
    <p style='color:black;'>如有任何問題，請洽下方聯絡管道！</p>\
    <br>\
    <p style='color:black;'>醫甸面試團隊</p>\
    <p style='color:black;'>敬上</p>\
    <hr>\
    <p style='color:black;'>醫甸面試 Edentedu.info</p>\
    <p style='color:black;'>聯絡信箱：contact@edentedu.info</p>\
    <p style='color:black;'>官方網站：Edentedu.info</p>\
    <p style='color:black;'>粉絲團：facebook.com/ednet.tech</p>\
  </body>";
  var options = {
    from: '"醫甸面試" no-reply@edentedu.info',
    to: email,
    subject:'註冊成功',
    html:html
  }
  transporter.sendMail(options, function(error, info) {
    if (error) {
      console.log(error);
    }
  });
}

exports.authorize = function authorize(user){
  var html = "\
  <body style='color:black;'>\
    <p style='color:black;'>**此為自動發送信箱，請勿直接回覆**</p>\
    <p style='color:black;'>親愛的同學您好，</p>\
    <p style='color:black;'>您已通過驗證</p>\
    <hr>\
    <p style='color:black;'>醫甸面試 Edentedu.info</p>\
    <p style='color:black;'>聯絡信箱：contact@edentedu.info</p>\
    <p style='color:black;'>官方網站：Edentedu.info</p>\
    <p style='color:black;'>粉絲團：facebook.com/ednet.tech</p>\
  </body>";
  var options = {
    from: '"醫甸面試" no-reply@edentedu.info',
    to: user.email,
    subject:'驗證成功',
    html:html
  }
  transporter.sendMail(options, function(error, info) {
    if (error) {
      console.log(error);
    }
  });
}

exports.noticeTeacher = function noticeTeacher(student,teacher,question){
  var html = "\
  <body style='color:black;'>\
    <p style='color:black;'>**此為自動發送信箱，請勿直接回覆**</p>\
    <p style='color:black;'>親愛的 "+teacher.name+" 老師您好，</p>\
    <p style='color:black;'>您被分配到一個新問題，等待您給予回應：</p>\
    <p style='color:black;'>學生姓名："+student.name+"</p>\
    <p style='color:black;'>學生報考校系："+student.school+"</p>\
    <p style='color:black;'>題目："+question.content+"</p>\
    <p style='color:black;'>回答網址：http://edentedu.info/"+question.id+"</p>\
    <p style='color:black;'>請您儘快登入本站大平台，並請於<span style='color:rgb(229,92,136);'>「3天內」</span>給予回覆。</p>\
    <p style='color:black;'>如有不知如何回答的問題，請於老師團群聊發問。</p>\
    <p style='color:black;'>如有其他任何問題，請私訊佑儒。</p>\
    <br>\
    <p style='color:black;'>醫甸面試團隊</p>\
    <p style='color:black;'>敬上</p>\
    <hr>\
    <p style='color:black;'>醫甸面試 Edentedu.info</p>\
    <p style='color:black;'>聯絡信箱：contact@edentedu.info</p>\
    <p style='color:black;'>官方網站：Edentedu.info</p>\
    <p style='color:black;'>粉絲團：facebook.com/ednet.tech</p>\
  </body>";
  var options = {
    from:'"醫甸面試" no-reply@edentedu.info',
    to:teacher.email,
    subject:'分配題目',
    html:html
  }
  transporter.sendMail(options, function(error, info) {
    if (error) {
      console.log(error);
    }
  });
}

exports.noticeStudent = function noticeStudent(student,teacher,comment,question) {
  var html = "\
  <body style='color:black;'>\
    <p style='color:black;'>**此為自動發送信箱，請勿直接回覆**</p>\
    <p style='color:black;'>親愛的 "+student.name+" 同學您好，</p>\
    <p style='color:black;'>您於前陣子上傳的影片已被老師回應：</p>\
    <p style='color:black;'>題目： "+question.content+"</p>\
    <p style='color:black;'>題目網址：http://edentedu.info/"+question.id+"</p>\
    <p style='color:black;'>老師："+teacher.name+" "+teacher.nowschool+"</p>\
    <p style='color:black;'>回應內容：</p>\
    <p style='color:black;'>"+comment+"</p>\
    <br><br>\
    <p style='color:black;'>*醫甸面試提醒您，老師團隊係由往年各校優秀面試學長姊組成，為系統自動分配，不一定剛好符合您要報考的校系。\
    我們相信，由此隨機的分配機制，將可讓您接收不同老師、不同觀點的機會。您於本站12次的回應，都是我們相當重視的。\
    醫學系的同學也可以聽到牙醫系的想法，牙醫系的同學也可以知道醫學系在想些什麼。\
    我們也希望您，能重視老師們的回應，改進自己、再接再厲，戰勝醫學系、牙醫系！</p>\
    <p style='color:black;'>醫甸面試團隊</p>\
    <p style='color:black;'>敬上</p>\
    <hr>\
    <p style='color:black;'>醫甸面試 Edentedu.info</p>\
    <p style='color:black;'>聯絡信箱：contact@edentedu.info</p>\
    <p style='color:black;'>官方網站：Edentedu.info</p>\
    <p style='color:black;'>粉絲團：facebook.com/ednet.tech</p>\
  </body>"
  var options = {
    from:'"醫甸面試" no-reply@edentedu.info',
    to:student.email,
    subject:'老師回覆',
    html:html
  }
  transporter.sendMail(options, function(error, info) {
    if (error) {
      console.log(error);
    }
  });
}

exports.remindFinance = function remindFinance(accoutnumber){
  var content = "**此為自動發送信箱，請勿直接回覆**\nYoda 您好，\n以下帳號（之末四碼）已完成轉帳\n" + accoutnumber;
  var options = {
    from:'"醫甸面試" no-reply@edentedu.info',
    to:"s0937800231@gmail.com",
    subject:'匯款通知',
    text: content
  }
  transporter.sendMail(options, function(error, info) {
    if (error) {
      console.log(error);
    }
  });
}

exports.forgetPw = function forgetPw(user) {
  var html = "\
  <body style='color:black;'>\
    <p style='color:black;'>**此為自動發送信箱，請勿直接回覆**</p>\
    <p style='color:black;'>親愛的 "+user.name+" 您好，</p>\
    <p style='color:black;'>請透過以下連結重設密碼</p>\
    <p style='color:black;'>http://edentedu.info/user/editpw?email="+user.email+"&i="+user.id+"</p>\
    <p style='color:black;'>若您未曾於醫甸面試點選「忘記密碼」，請立刻寄信至聯絡信箱（contact@edentedu.info）舉報此問題！若有其他疑慮，請洽下方聯絡管道。</p>\
    <p style='color:black;'>醫甸面試團隊<p>\
    <p style='color:black;'>敬上<p>\
    <hr>\
    <p style='color:black;'>醫甸面試 Edentedu.info</p>\
    <p style='color:black;'>聯絡信箱：contact@edentedu.info</p>\
    <p style='color:black;'>官方網站：Edentedu.info</p>\
    <p style='color:black;'>粉絲團：facebook.com/ednet.tech</p>\
  </body>";
  var options = {
    from: '"醫甸面試" no-reply@edentedu.info',
    to: user.email,
    subject: '重設密碼',
    html: html
  }
  transporter.sendMail(options, function(error, info) {
    if (error) {
      console.log(error);
    }
  });
}
