Template.profile.events({
	'click .go-back-you-are-drunk':function(e,t){
		e.preventDefault();
		//hacky
		history.back();
	}
});

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
		return Session.get('avatar');
	}
});

Template.profile.rendered = getAvatar();