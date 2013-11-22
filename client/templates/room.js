ouSub=Meteor.subscribe('usersOnlineInThisRoom',Session.get('roomid'));
mSub=Meteor.subscribeWithPagination('paginatedMessages',Session.get('roomid'), messagesLimit);


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
		// 
		if( Rooms.findOne() ){
			// 
			// 
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
	'click .go-home-you-are-drunk' : function(evnt,tmplt){
		evnt.preventDefault();
		ouSub.stop();
		Meteor.Router.to('/');
	},
	'click #userstats' : function(evnt,tmplt){
		evnt.preventDefault();
		goOffline();
		ouSub.stop();
		Meteor.Router.to('/profile');
	},
	'click #logout' : function(evnt,tmplt){
		//
		evnt.preventDefault();

		if(Meteor.status().connected === false){
			alert("Please sign out once you are connected to the internet again, sorry for that :(");
			Meteor.reconnect();
			return;
		}

		goOffline();
		
		Meteor.logout(function(){
		});
	},
	'click .online-user':function(evnt,tmplt){
		var ind=0;
		//don't hide my messages
		if(evnt.target.getAttribute('data-userid') === Meteor.userId())return;
		
		var offsetBottom = document.body.offsetHeight;
		if(document.body.scrollTop > 0)
			offsetBottom -= document.body.scrollTop;
		else
			offsetBottom -= document.documentElement.scrollTop;

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
		
		
		if(document.body.scrollTop > 0)
			document.body.scrollTop = document.body.offsetHeight - offsetBottom;
		else
			document.documentElement.scrollTop = document.body.offsetHeight - offsetBottom;
	},
	'keyup #enter-tag' : function(evnt,tmplt){
		if(evnt.keyCode === 13){
			var txt = tmplt.find('#enter-tag').value.trim();
			//enter tag only if string is not empty and has no spaces
			if(txt.length > 0 && txt.length < 15 &&  txt.indexOf(' ') <= 0){
				//enter tag
				Rooms.update({_id:Rooms.findOne()._id},{$addToSet:{tags:txt}});
				tmplt.find('#enter-tag').value ='';
			}
		}
	},
	'click .tag':function(evnt,tmpl){
		var rem=unescapeHtml(evnt.target.innerHTML);
		
		Rooms.update({_id:Rooms.findOne()._id},{$pull:{tags:rem}});

	}
});


Template.room.rendered=function(){
	//console.log('room rendered');
	positionFixedContent();

	notif = document.querySelector('#new_message');
	if(notif)
		notif.load();

	if(onlineUsersObserver)
		onlineUsersObserver.stop();

	$('.online-user-wrapper').remove();

	onlineUsersObserver=OnlineUsers.find().observe({
		added:function(doc){
			var ou =  $('<li class="online-user-wrapper" id="'+doc._id+'"><span class="status-badge '+doc.status+'"></span><span class="micro-avatar" style="background:url(\''+doc.avatar+'\')"></span><span class="online-user" data-userid="'+doc.userid+'">'+doc.nickname+'</span></li>');
			$('#append-online-user-here').before(ou);

			autoCompleteUsername(doc.nickname,doc.avatar);

		},
		changed:function(doc){
			$('#'+doc._id+' .status-badge')[0].className = 'status-badge ' + doc.status;
			$('#'+doc._id+' .micro-avatar').css({'background':doc.avatar});
		},
		removed:function(doc){
			// 
			$('#'+doc._id).remove();
		}
	});

	$('.userinfo:not(.bound)').addClass('bound').bind('click',  function(){ $('.usermenu').toggleClass('show'); });

	$('.Modal:not(.bound)').addClass('bound').bind('click',function(e){e.stopPropagation()});
	$('.toggle-Modal:not(.bound)').addClass('bound').bind('click',function(){$(this).toggleClass('is-Hidden')});

	$('.tipstricks-toggle:not(.bound)').addClass('bound').bind('click',function(){
		$('#tipstricks-modal.is-Hidden').toggleClass('is-Hidden');
	});
	
	$('.settings-toggle:not(.bound)').addClass('bound').bind('click',function(){
		$('#settings-modal.is-Hidden').toggleClass('is-Hidden');
	});

	$('.invite-toggle:not(.bound)').addClass('bound').bind('click',function(){
		$('#invite-modal.is-Hidden').toggleClass('is-Hidden');
	});
}



Meteor.setInterval(function () {
	if(Session.get('roomid') && Meteor.user()){
		// 
		goOnline();
	}
}, keepaliveTime);


Meteor.call('serverTime',function(error, result){
	servert=result;
	tdiff = servert - clientt;
});



Meteor.startup(function(){
	Deps.autorun(function(){
		if( Meteor.user() ){
			Meteor.subscribe('userData');
			goOnline();
			//tracking yo ass to enhance your experience, not because I'm a data whore
			if(mixpanel){
				// 
				mixpanel.identify(Meteor.userId());
				mixpanel.people.set({
					'$name': Meteor.user().profile.name,
					'$created': new Date(Meteor.user().createdAt),
					'service': getServiceString()
				});
				// 				
			}
		}
	});
});