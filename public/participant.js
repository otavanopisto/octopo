(function() {
  'use strict';
  
  $(document).on('socketOpen', function (event, data) {
    var socket = data.socket;
    
    socket.on('issue.select', function (data) {
      $('.story-estimation').removeAttr('disabled');
    });

    socket.on('estimations.reveal', function (data) {
      $('.story-estimation-selected').removeClass('story-estimation-selected');
      $('.story-estimation').attr('disabled', 'disabled');
    });
    
    socket.on('estimations.reset', function (data) {
      $('.story-estimation-selected').removeClass('story-estimation-selected');
      $('.story-estimation').removeAttr('disabled');
    });
    
    socket.on('issue.estimate-saved', function (data) {
      $('.story-estimation-selected').removeClass('story-estimation-selected');
      $('.story-estimation').attr('disabled', 'disabled');
      $('.current-story-details').text('Wait for Master to select the story to be estimated');
    });
    
    $(document).on('click', '.story-estimation', function (event) {
      if ($(event.target).attr('disabled') !== 'disabled') {
        var number = $('.current-story-details').attr('data-number');
        
        $('.story-estimation-selected').removeClass('story-estimation-selected');
        $(event.target).addClass('story-estimation-selected');
        
        socket.emit('issue.estimate', {
          number: number,
          estimationName : $(event.target).data('estimation-name'),
          estimationColor: $(event.target).data('estimation-color'),
          userId: $('input[name="user-id"]').val()
        });
      }
    });
  });
  
}).call(this);