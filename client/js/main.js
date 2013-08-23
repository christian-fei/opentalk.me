Meteor.startup(function(){

	FastClick.attach(document.body);

	$(document).ready(function() {
		
		positionFixedContent();

		$(window).resize(function(){
			positionFixedContent();
		});

		$(document).wipetouch({
			preventDefault:false,
			wipeLeft: function(result) {
				hideSidebar();
			},
			wipeRight: function(result) {
				showSidebar();
			}
		});
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