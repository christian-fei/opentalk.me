Template.admin.helpers({
	'onlineUsers' : function(){
		return OnlineUsers.find();
	},
	'messages' : function(){
		return Messages.find({},{sort:{timestamp:-1}});
	},
	'lastSeen' : function(){
		return LastSeenInRoom.find({},{sort:{timestamp:-1}});
	}
});

Deps.autorun(function(){
	if(Meteor.user() && window.location.pathname === '/admin'){
		Meteor.subscribe('OnlineUsersAdmin');
		Meteor.subscribe('MessagesAdmin');
	}	
});