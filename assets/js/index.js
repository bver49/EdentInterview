$(document).ready(function() {

  // top menu
  var menu_open = 0;
  var menu_speed = 500;
  $(".linkset").animate({
    top: '-=300px'
  }, 0);
  $(".burger").click(function() {
    if (menu_open == 0) {
      menu_open = 1;
      $(".linkset").animate({
        top: '+=300px'
      }, menu_speed);
    } else if (menu_open == 1) {
      menu_open = 0;
      $(".linkset").animate({
        top: '-=300px'
      }, menu_speed);
    }
  });

  //login
  $("form#login").submit(function(event){
    event.preventDefault();
    var formData = $("#login").serialize();
    $.ajax({
      url: '/user/auth',
      type: 'post',
      data: formData,
      success: function(response){
        if(response=="Success"){
          window.location.href = "/question/";
        }
        else if(response=="No_auth"){
          window.location.href = "/user/notice/";
        }
        else if(response=="Edit"){
          window.location.href = "/user/editA";
        }
        else if(response=="Edit_t"){
          window.location.href = "/user/editD";
        }
        else if(response=="No_user"){
          $("#error").empty();
          $("#error").prepend("<p class='textcenter red'>找無此用戶</p>");
        }
        else if(response=="Pw_err"){
          $("#error").empty();
          $('#error').prepend("<p class='textcenter red'>密碼錯誤</p>");
        }
      }
    });
  });
});

function adjustpic() {
	var height = $(".photo").prop("height");
	var width = $(".photo").prop("width");
	var length = $(".roundpic").css("width").replace("px", "");
	var half = length/2 ;
	var move = 0 ;
	if (width > height) {
		$(".photo").css("height",length);
		$(".photo").css("width","auto");
		width = $(".photo").prop("width");
	}
	else {
		$(".photo").css("width",length);
		$(".photo").css("height","auto");
		height = $(".photo").prop("height");
	}
}

function addCalendar(){
  for (i = new Date().getFullYear(); i > 1980; i--) {
    $('#years').append($('<option />').val(i).html(i));
  }

  for (i = 1; i < 13; i++) {
    $('#months').append($('<option />').val(i).html(i));
  }
  updateNumberOfDays();
}

function updateNumberOfDays() {
  $('#days').html('');
  month = $('#months').val();
  year = $('#years').val();
  days = daysInMonth(month, year);
  for (i = 1; i < days + 1; i++) {
    $('#days').append($('<option />').val(i).html(i));
  }
}

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}
