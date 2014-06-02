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
					  $("#available-rooms").append("<a href='/selectroom?room="+roomName+"' id='room_"+roomName+"' >"+roomName+"</a>");
				  }
			  }
		  }
		  $("#available-rooms").children().each(function(){
			  if($(this)[0].hasAttribute("id")){
			  var domRoom = $(this).attr("id").split("_")[1];
				  if(foundRooms.indexOf(domRoom) == -1){
					  $(this).remove();
				  }
			  }
		  });
		  if ($('#available-rooms').is(':empty')){
			  $("#available-rooms").append("<p class='placeholder'>No poker sessions available, please wait for the master to start one.</p>");
		  }
	  });
  }
  
}).call(this);