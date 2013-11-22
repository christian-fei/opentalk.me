Deps.autorun(function(){
	if(Meteor.user() && window.location.pathname === '/admin'){
		Meteor.subscribe('OnlineUsersAdmin');
		Meteor.subscribe('MessagesAdmin');
		Meteor.subscribe('UsersAdmin');
	}

	if(Meteor.user()){
		Meteor.subscribe('userData');
	}
	if(Session.get('avatar')){
		//when the avatar changes go online 
		// to update the avatar to all the clients
		goOnline();
	}

	Meteor.subscribe('roomTags',Session.get('roomid'));

	getAvatar();
});