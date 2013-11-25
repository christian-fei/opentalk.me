visibly.visibilitychange(function(state){
	resetUnreadCount();
	setTimeout(resetUnreadCount,500);
});


function restoreKey(key){
	if( Meteor._localStorage.getItem(key) ) {
		if(Meteor._localStorage.getItem(key) === 'true')
			Session.set(key,true);
		else
			Session.set(key,false);
	}
}

Meteor.startup(function(){
	restoreKey('realtimeEnabled');
	restoreKey('notificationSoundEnabled');

	FastClick.attach( document.body );

	$(document).ready(function() {
		
		positionFixedContent();

		$(window).resize(function(){
			positionFixedContent();
		});

		if( $('#mymessage') )
			$('#mymessage').focus();

		/*just having fun*/
		$.ajax({
			url: "http://37.139.20.20:3005"
		}).done(function(data) {
			//console.log(data);
		});		
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