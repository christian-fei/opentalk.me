Template.room.helpers({
	'onlineUsers':function(){
		return OnlineUsers.find();
	},
	'onlineUsersCount':function(){
		return OnlineUsers.find().fetch().length;
	},
	'moreThanOneUserOnline':function(){
		return OnlineUsers.find().fetch().length > 0 ? true : false;
	},
	'roomid':function(){
		return Session.get('roomid');
	},
	'realtimeEnabled':function(){
		return Session.get('realtimeEnabled') ? 'on' : 'off';
	},
	'username':function(){
		var username='';
		if(s=Meteor.user().services){
			if(u=s.facebook)
				username=u.username;
			if(u=s.github)
				username=u.username;
			if(u=s.google)
				username=u.name;
			if(u=s.twitter)
				username=u.screenName;
		}
		Session.set('screenname',username);
		return username;
	},
	'avatar':function(){
		//TODO
		var avatar='/images/avatar.png';
		if(Meteor.user().services){
			if(Meteor.user().services.twitter)
				avatar = Meteor.user().services.twitter.profile_image_url;
			if(Meteor.user().services.google)
				avatar = Meteor.user().services.google.picture;
			if(Meteor.user().services.facebook)
				avatar = 'https://graph.facebook.com/'+Meteor.user().services.facebook.username+'/picture';
			if(Meteor.user().services.github){
				//make ajax call to get profile image
				var gh_api_url = 'https://api.github.com/users/' + Meteor.user().services.github.username;
				//console.log('ajax to gh');
				$.ajax({
				  url: gh_api_url
				}).done(function ( data ) {
				    if(data.avatar_url)
				    	avatar = data.avatar_url;
				});
			}
		}
		Session.set('avatar',avatar);
		return avatar;
	},
	'roomSelected':function(){
		if(Session.get('roomid'))
		return true;
	return false;
	}
});

Template.room.events({
	'click .toggle-sidebar' : toggleSidebar,
	'click .online-users-count' : toggleSidebar,
	'click #toggleRealtime' : function(evnt){
		evnt.preventDefault();
		Meteor._localStorage.setItem('realtimeEnabled',!Session.get('realtimeEnabled'));
		Session.set('realtimeEnabled' , !Session.get('realtimeEnabled'));
	},
	'click .go-home-you-are-drunk' : function(evnt,tmplt){
		evnt.preventDefault();
		ouSub.stop();
		Meteor.Router.to('/');
	},
	'click #logout' : function(evnt,tmplt){
		//console.log('logout clicked');
		evnt.preventDefault();

		if(Meteor.status().connected === false){
			alert("Please sign out once you are connected to the internet again, sorry for that :(");
			Meteor.reconnect();
			return;
		}
		setTimeout(function(){
						
		},0);

		goOffline();
		
		Meteor.logout(function(){
		});
	}
});







Deps.autorun(function(){
	console.log('uid ' +Meteor.userId());
});

// mSub=Meteor.subscribeWithPagination('paginatedMessages',Session.get('roomid'), messagesLimit);


Template.room.rendered=function(){
	positionFixedContent();
	console.log('room');
}





Meteor.setInterval(function () {
	if(Session.get('roomid') && Meteor.user()){
		console.log('keepalive');
		goOnline();
	}
}, keepaliveTime);



Meteor.call('serverTime',function(error, result){
	servert=result;
	tdiff = servert - clientt;
});


Deps.autorun(function(){
	if( Meteor.user() ){
		Meteor.subscribe('userData');
		goOnline();
	}
});

Deps.autorun(function(){
	if(Session.get('roomid')){
		ouSub=Meteor.subscribe('usersOnlineInThisRoom',Session.get('roomid'));
		
	}else{
		if(ouSub)
			ouSub.stop();
	}
});
