(function() {
  /* global io */
  'use strict';
  
  $(document).ready(function () {
    var socket = io.connect();
    
    socket.emit('join', {
      userId: $('input[name="user-id"]').val(),
      userName: $('input[name="user-name"]').val(),
      userRole: $('input[name="user-role"]').val(),
      userAvatar: $('input[name="user-avatar"]').val(),
      currentRoom: $('input[name="currentRoom"]').val()
    });
    
    $(document).trigger("socketOpen", { socket: socket });

    $('.story-estimation').attr('disabled', 'disabled');
    socket.emit('join', {
      userId: $('input[name="user-id"]').val(),
      userName: $('input[name="user-name"]').val(),
      userRole: $('input[name="user-role"]').val(),
      userAvatar: $('input[name="user-avatar"]').val(),
      currentRoom: $('input[name="currentRoom"]').val()
   });
    
    socket.on('clients', function (data) {
      var clients = data.clients;
      var activeParticipants = [];
      for (var i = 0, l = clients.length; i < l; i++) {
        var client = clients[i];
        if (client.userRole === 'participant') {
          activeParticipants.push(client.userId);
          if ($('div.story-estimation-participant[data-userId="' + client.userId + '"]').length === 0) {
            $('<div>')
              .attr({ 'data-userId': client.userId, 'title': client.userName })
              .append($('<img>').attr('src', client.userAvatar + 's=32').addClass("participant-avatar-img"))
              .append($('<div>').addClass("story-estimation-participant-estimate"))
              .addClass('story-estimation-participant')
              .appendTo('.story-estimation-participants');
          }
        }
      }
      $('.story-estimation-participant').each(function(){
    	  var userid = $(this).data('userid').toString();
		  if(activeParticipants.indexOf(userid) == -1){
			  $(this).remove();
		  }
      });
    });
    
    socket.on('issue.estimate', function (data) {
      var participant = $('div.story-estimation-participant[data-userId="' + data.userId + '"]');
      
      participant.find('.story-estimation-participant-estimate')
        .data({
          estimationColor: data.estimationColor,
          estimationName: data.estimationName
        })
        .text('Ready')
        .addClass('story-estimation-participant-estimate-visible');
    });
    
    socket.on('estimations.reveal', function (data) {
      $('.story-estimation-participant-estimate').each(function (index, estimate) {
        $(estimate).css({ background: '#' + $(estimate).data('estimationColor') }).text($(estimate).data('estimationName'));
      });
    });
    
    socket.on('estimations.reset', function (data) {
      $('.story-estimation-participant-estimate').each(function (index, estimate) {
        $(estimate)
          .css({ background: '' })
          .removeClass('story-estimation-participant-estimate-visible').text('');
      });
    });
    
    socket.on('issue.estimate-saved', function (data) {
      $('.story-estimation-participant-estimate').removeClass('story-estimation-participant-estimate-visible').text('');
    });
    
    socket.on('issue.select', function (data) {
      var issueNumber = data.number;
      
      $('.current-story-details').text('Story #' + issueNumber + ' - loading...');
      $('.current-story-details').attr('data-number', null);
      
      $.ajax('/_estimation?number=' + data.number, {
        success: function (data, textStatus, jqXHR) {
          $('.current-story-details')
            .html(data)
            .attr('data-number', issueNumber);
        }
      });
    });

  });
  
}).call(this);