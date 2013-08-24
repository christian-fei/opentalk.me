Template.profile.helpers({
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
	'userMessagesCount':function(){
		Meteor.call('userMessagesCount',function(err,result){
			Session.set('userMessagesCount',result);
		});
		return Session.get('userMessagesCount');
	},
	'userRoomsCount':function(){
		Meteor.call('userRoomsCount',function(err,result){
			Session.set('userRoomsCount',result);
		});
		return Session.get('userRoomsCount');
	},
});