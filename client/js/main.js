visibly.visibilitychange(function(state){
	resetUnreadCount();
	setTimeout(resetUnreadCount,1000);
});


Meteor.startup(function(){	
	if(Meteor._localStorage.getItem('realtimeEnabled') === null){
		//set default
		Meteor._localStorage.setItem('realtimeEnabled',true);
		Session.set('realtimeEnabled',true);
	} else {
		if(Meteor._localStorage.getItem('realtimeEnabled') === 'true')
			Session.set('realtimeEnabled',true);
		else
			Session.set('realtimeEnabled',false);
	}


	FastClick.attach(document.body);

	$(document).ready(function() {
		
		positionFixedContent();

		$(window).resize(function(){
			positionFixedContent();
		});

		if( $('#mymessage') )
			$('#mymessage').focus();
	});


	if(!Modernizr.input.placeholder){
		$('[placeholder]').focus(function() {
		var input = $(this);
		if (input.val() == input.attr('placeholder')) {
			input.val('');
			input.removeClass('placeholder');
		}
		}).blur(function() {
			var input = $(this);
			if (input.val() == '' || input.val() == input.attr('placeholder')) {
				input.addClass('placeholder');
				input.val(input.attr('placeholder'));
			}
		}).blur();
		$('[placeholder]').parents('form').submit(function() {
			$(this).find('[placeholder]').each(function() {
				var input = $(this);
				if (input.val() == input.attr('placeholder')) {
					input.val('');
				}
			})
		});
	}
});



window.onbeforeunload=window.onunload=goOffline;