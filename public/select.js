(function() {
  'use strict';

  $(document).ready(function(){
		$("#masterBtn").click(function(){		
			$("#roomNameContainer").toggle();
		});
		
		$("#newRoomName").keyup(function(){
			if($(this).val() != ""){
				$("#startPokerBtn").removeAttr("disabled");
			}else{
				$("#startPokerBtn").attr("disabled", "disabled");
			}
		});
  });
	
}).call(this);