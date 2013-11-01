Template.settings.helpers({
	'realtimeEnabled':function(){
		return Session.get('realtimeEnabled') ? 'on' : 'off';
	},
	'notificationSoundEnabled':function(){
		return Session.get('notificationSoundEnabled') ? 'on' : 'off';
	}
});

Template.settings.events({
	'click #toggleRealtime' : function(evnt){
		evnt.preventDefault();
		Meteor._localStorage.setItem('realtimeEnabled',!Session.get('realtimeEnabled'));
		Session.set('realtimeEnabled' , !Session.get('realtimeEnabled'));
	},
	'click #toggleNotificationSound' : function(evnt){
		evnt.preventDefault();
		Meteor._localStorage.setItem('notificationSoundEnabled',!Session.get('notificationSoundEnabled'));
		Session.set('notificationSoundEnabled' , !Session.get('notificationSoundEnabled'));
		
		
		if( Session.get('notificationSoundEnabled') ){
			if(notif)
				notif.play();
		}
	},
	'click #removeMessagesRoom':function(evnt){
		evnt.preventDefault();
		if(confirm('Are you sure?\nDo you really want to remove your messages from this chatroom?')){
			Meteor.call('removeMessagesOfUserInRoom',Session.get('roomid'),function(){
				
				var sccsrmmr = $('.success.removeMessagesRoom');
				sccsrmmr.addClass('yes');
				//so that the user can be 'notified' (visually) again
				setTimeout(function(){
					sccsrmmr.removeClass('yes');
				},4000);
			});
		}
	},
	'click #removeMessages':function(evnt){
		evnt.preventDefault();
		if(confirm('Are you sure?\nDo you really want to remove all your messages?')){
			if( confirm('Let me rephrase that: \nDo you really want to remove all your messages?\nThis action CANNOT be undone') ) {
				Meteor.call('removeMessagesOfUser',Meteor.userId(),function(){
					
					var sccsrm = $('.success.removeMessages');
					sccsrm.addClass('yes');
					//so that the user can be 'notified' (visually) again
					setTimeout(function(){
						sccsrm.removeClass('yes');
					},4000);
				});
			}
		}
	}
});