Template.settings.helpers({
	'realtimeEnabled':function(){
		return Session.get('realtimeEnabled') ? 'on' : 'off';
	}
});

Template.settings.events({
	'click #toggleRealtime' : function(evnt){
		evnt.preventDefault();
		console.log('rt toggle');
		Meteor._localStorage.setItem('realtimeEnabled',!Session.get('realtimeEnabled'));
		Session.set('realtimeEnabled' , !Session.get('realtimeEnabled'));

		$('html').removeClass('has-overlay');//some weird shit with modal
	},
	'click #removeMessagesRoom':function(evnt){
		evnt.preventDefault();
		if(confirm('Are you sure?\nDo you really want to remove your messages from this chatroom?')){
			Meteor.call('removeMessagesOfUserInRoom',Meteor.userId(),Session.get('roomid'),function(){
				console.log('success');
				var sccsrmmr = $('.success.removeMessagesRoom');
				sccsrmmr.addClass('yes');
				//so that the user can be 'notified' (visually) again
				setTimeout(function(){
					sccsrmmr.removeClass('yes');
				},5000);
			});
		}
	},
	'click #removeMessages':function(evnt){
		evnt.preventDefault();
		if(confirm('Are you sure?\nDo you really want to remove all your messages?')){
			if( confirm('Let me rephrase that: \nDo you really want to remove all your messages?\nThis action CANNOT be undone') ) {
				Meteor.call('removeMessagesOfUser',Meteor.userId(),function(){
					console.log('success');
					var sccsrm = $('.success.removeMessages');
					sccsrm.addClass('yes');
					//so that the user can be 'notified' (visually) again
					setTimeout(function(){
						sccsrm.removeClass('yes');
					},5000);
				});
			}
		}
	}
});