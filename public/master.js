(function() {
  'use strict';
  
  $(document).on('click', '.category-list-group .list-group-item', function (event) {
    event.preventDefault();
    
    $('.category-list-group .list-group-item').removeClass('active');
    $(event.target).addClass('active');
    
    $('.story-list-group').hide();
    $('.story-list-group[data-category="' + $(event.target).data('category') + '"]').show();
  });
  
  $(document).ready(function () {
    $('.reveal-estimations').attr('disabled', 'disabled');
    $('.reset-estimations').attr('disabled', 'disabled');
  });
  
  $(document).on('socketOpen', function (event, data) {
    var socket = data.socket;
    
    $(document).on('click', '.story-list-group h4', function (event) {
      var number = $(event.target).data('issue-number');
      if (!number) {
        number = $(event.target).closest('*[data-issue-number]').data('issue-number');
      }
        
      socket.emit('issue.select', { number: number });
    });
    
    $(document).on('click', '.reveal-estimations', function(event) {
      event.preventDefault();
      socket.emit('estimations.reveal', { });
    });
    
    $(document).on('click', '.reset-estimations', function(event) {
      event.preventDefault();
      socket.emit('estimations.reset', { });
    });
    
    $(document).on('click', '.story-estimation', function (event) {
      if ($(event.target).attr('disabled') !== 'disabled') {
        var number = $('.current-story-details').attr('data-number');
        var estimate = $(event.target).data('estimation-name');
        $.ajax('/_save-estimation', {
          data: {
            number: number,
            estimate: estimate
          },
          success: function (data, textStatus, jqXHR) {
            socket.emit('issue.estimate-saved', { number: number, estimate: estimate });
          }
        });
      }
    });
    
    socket.on('issue.estimate', function (data) {
      $('.reveal-estimations').removeAttr('disabled');
    });
    
    socket.on('estimations.reveal', function (data) {
      $('.story-estimation').removeAttr('disabled');
      $('.reveal-estimations').attr('disabled', 'disabled');
      $('.reset-estimations').removeAttr('disabled');
    });
    
    socket.on('estimations.reset', function (data) {
      $('.story-estimation').attr('disabled', 'disabled');
      $('.reveal-estimations').removeAttr('disabled');
      $('.reset-estimations').attr('disabled', 'disabled');
    });
    
    socket.on('issue.estimate-saved', function (data) {
      $('.story-estimation').attr('disabled', 'disabled');
      $('.reveal-estimations').attr('disabled', 'disabled');
      $('.reset-estimations').attr('disabled', 'disabled');
      $('.current-story-details').text('Please select a story');
    });
    
  });
  
}).call(this);