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
		scrollDown();
		return username;
	},
	'avatar':function(){
		return Session.get('avatar');
	},
	'roomSelected':function(){
		if(Session.get('roomid'))
		return true;
	return false;
	},
	'roomTags':function(){
		// console.log(Rooms.find().fetch());
		if( Rooms.findOne() ){
			console.log('returning tags array');
			console.log(Rooms.findOne().tags);
			return Rooms.findOne().tags;
		}else
			return [];
	},
	'gimmeMoreTags':function(){
		if( Rooms.findOne() &&  (!Rooms.findOne().tags || Rooms.findOne().tags.length < 5) )
			return true;
		return false;
	}
});

Template.room.events({
	'click .toggle-sidebar' : toggleSidebar,
	'click .online-users-count' : toggleSidebar,
	'click #userstats' : function(){
		goOffline();
		ouSub.stop();
		Meteor.Router.to('/profile');
	},
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
	'click #userstats' : function(evnt,tmplt){
		evnt.preventDefault();
		ouSub.stop();
		Meteor.Router.to('/profile');
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
	},
	'click .online-user':function(evnt,tmplt){
		var ind=0;
		//don't hide my messages
		if(evnt.target.getAttribute('data-userid') === Meteor.userId())return;
		if(ind=trolls.indexOf(evnt.target.getAttribute('data-userid')) >=0){
			//remove from trolls
			trolls.pop(ind);
		}else{
			trolls.push(evnt.target.getAttribute('data-userid'));
		}
		if(!evnt.target.classList.contains('strike'))
			evnt.target.classList.add('strike');
		else
			evnt.target.classList.remove('strike');

		$('.message[data-userid="'+evnt.target.getAttribute('data-userid')+'"]').toggle();
	},
	'keyup #enter-tag' : function(evnt,tmplt){
		if(evnt.keyCode === 13){
			var txt = tmplt.find('#enter-tag').value.trim();
			//enter tag only if string is not empty and has no spaces
			if(txt.length > 0 && txt.length < 15 &&  txt.indexOf(' ') <= 0){
				//enter tag
				console.log('enter tag');
				Rooms.update({_id:Rooms.findOne()._id},{$addToSet:{tags:txt}});
				tmplt.find('#enter-tag').value ='';
			}
		}
	},
	'click .tag':function(evnt,tmpl){
		console.log(evnt)
		console.log(evnt.target.innerHTML);
		var rem=evnt.target.innerHTML;
		Rooms.update({_id:Rooms.findOne()._id},{$pull:{tags:rem}});

	}
});



Meteor.startup(function(){
	OnlineUsers.find().observeChanges({
		added:function(id,fields){
			var ou =  $('<li class="online-user-wrapper" id="'+id+'"><span class="status-badge '+fields.status+'"></span><span class="online-user" data-userid="'+fields.userid+'">'+fields.nickname+'</span></li>');
			console.log(ou);
			$('#append-online-user-here').before(ou);
		},
		changed:function(id,fields){
		},
		removed:function(id){
			//TODO, show messages of user even if troll, or just hide them??
			$('#'+id).remove();
		}
	});
});


Deps.autorun(function(){
	// console.log('uid ' +Meteor.userId());
	Meteor.subscribe('roomTags',Session.get('roomid'));
});

Deps.autorun(function(){
	var avatar='/images/avatar.png';
	if(Meteor.user()){
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
				    if(data.avatar_url){
				    	avatar = data.avatar_url;
					    Session.set('avatar',avatar);
				    }
				});
			}
		}
	}
	Session.set('avatar',avatar);
});


// mSub=Meteor.subscribeWithPagination('paginatedMessages',Session.get('roomid'), messagesLimit);


Template.room.rendered=function(){
	positionFixedContent();
	
	// console.log('room');
}





Meteor.setInterval(function () {
	if(Session.get('roomid') && Meteor.user()){
		// console.log('keepalive');
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
		console.log('Meteor.user()');
	}
});


function getServiceString(){
	//this should always be true
	if(Meteor.user()){
		if(Meteor.user().services.twitter)
			return 'twitter';
		if(Meteor.user().services.github)
			return 'github';
		if(Meteor.user().services.facebook)
			return 'facebook';
		if(Meteor.user().services.google)
			return 'google';
	}
	return '';
}

Meteor.startup(function(){
	Deps.autorun(function(){
		if( Meteor.user() ){
			//tracking yo ass to enhance your experience, not because I'm a data whore
			if(mixpanel){
				console.log('mixpanel identifying user');
				mixpanel.identify(Meteor.userId());
				mixpanel.people.set({
					'$name': Meteor.user().profile.name,
					'$created': new Date(Meteor.user().createdAt),
					'service': getServiceString()
				});
				console.log(getServiceString());				
			}
		}
	});
});