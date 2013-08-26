Template.profile.helpers({
	username:function(){
		var username='';
		if(!Meteor.user())return;
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
	avatar:function(){
		//TODO
		var avatar='/images/avatar.png';
		if(!Meteor.user())return;
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
	userMessagesCount:function(){
		return '<h1>' + Session.get('userMessagesCount') + '</h1>' + '<h6>messages</h6>';
	},
	userRoomsCount:function(){
		if(Session.get('userRoomsCount') > 1)
			return '<h1>' + Session.get('userRoomsCount') + '</h1>' + '<h6>chatrooms</h6>';
		return '<h1>' + Session.get('userRoomsCount') + '</h1>' + '<h6>chatroom</h6>';
	},
	userWordsCount:function(){
		return '<h1>' + Session.get('userWordsCount') + '</h1>' + '<h6>words</h6>';
	},
	userCharactersCount:function(){
		return '<h1>' + Session.get('userCharactersCount') + '</h1>' + '<h6>characters</h6>';
	},
	memberSince:function(){
		Session.set('memberSince',new Date(Meteor.user().createdAt).toDateString().substring(4));
		return '<h3>' + Session.get('memberSince') + '</h3>' + '<h6>member since</h6>';
	},
});

function renderUserRooms(r){
	//don't let it render multiple times when the user navigates to /profile (hack)
	// if($('.user-room').length)return;
	$('.user-room').remove();
	r.forEach(function(entry){
		$('#append-here').after( $('<li class="user-room"> <a href="/'+entry+'">'+entry+'</a></li>') );
	});
}

Template.profile.events({
	'click .go-back-you-are-drunk':function(e,t){
		e.preventDefault();
		//i have no idea why this works
		if(Session.get('roomid'))
			window.location='/'+Session.get('roomid');
		else
			window.location='/';
	}
});

Template.profile.rendered = function(){
	Meteor.call('getUserStats',function(err,result){
		Session.set('userMessagesCount',result.messagesCount);
		Session.set('userRoomsCount',result.roomsCount);
		Session.set('userWordsCount',result.wordsCount);
		Session.set('userCharactersCount',result.charactersCount);
		renderUserRooms(result.rooms);
	});
}
