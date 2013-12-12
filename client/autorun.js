Deps.autorun(function(){
	if(Meteor.user() && window.location.pathname === '/admin'){
		Meteor.subscribe('OnlineUsersAdmin');
		Meteor.subscribe('MessagesAdmin');
		Meteor.subscribe('UsersAdmin');
	}
});
Deps.autorun(function(){

	Meteor.subscribe('roomTags',Session.get('roomid'));

	getAvatar();
});
Deps.autorun(function(){
	if(Meteor.user()){
		Meteor.subscribe('userData');
	}
});
Deps.autorun(function(){
	if(Session.get('avatar')){
		//when the avatar changes go online 
		// to update the avatar to all the clients
		goOnline();
	}
});
