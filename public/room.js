(function() {
  'use strict';

  $(document).ready(function(){
	  getRooms();
	  setInterval(function(){getRooms()}, 3000);
  });
	
  function getRooms(){
	  $.getJSON( "/_rooms", function( json ) {
		  var foundRooms = [];
		  for (var roomName in json) {
			  if(roomName != ""){
				  $(".placeholder").remove();
				  roomName = roomName.replace("/", "");
				  foundRooms.push(roomName);
				  if($("#room_"+roomName).length == 0){
					  $("#roomList").append("<a class='list-group-item' href='/selectrole?role=participant&room="+roomName+"' id='room_"+roomName+"' >"+roomName+"</a>");
				  }
			  }
		  }
		  $("#roomList").children().each(function(){
			  if($(this)[0].hasAttribute("id")){
			  var domRoom = $(this).attr("id").split("_")[1];
				  if(foundRooms.indexOf(domRoom) == -1){
					  $(this).remove();
				  }
			  }
		  });
		  if ($('#roomList').is(':empty') && $('.placeholder').length == 0){
			  $("#available-rooms").append("<p class='placeholder'>No poker sessions available, please wait, or.</p>");
		  }
	  });
  }
  
}).call(this);