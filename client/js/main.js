//I don't know why this is not working properly in Chrome
Visibility.change(function (e, state) {
	console.log('Visibility changed');
	resetUnreadCount();
	// if(state === 'visible'){
	// 	//reset the favicon badge
	// 	//maybe after a certain amount of time toggle the class of unread messages
	// }
});

//should work in every browser
// setInterval(function () {
// 	// console.log('v every');
// 	if(Visibility.state() === 'visible')
// 		resetUnreadCount();
// },1000);

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

		// $(document).wipetouch({
		// 	preventDefault:false,
		// 	wipeLeft: function(result) {
		// 		hideSidebar();
		// 	},
		// 	wipeRight: function(result) {
		// 		showSidebar();
		// 	}
		// });


		if( $('#mymessage') )
			$('#mymessage').focus();
	});


	if(!Modernizr.input.placeholder){
		//console.log('there ain\'t no placeholder support in your shitty browser, dude');
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