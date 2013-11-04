var statsUpdater=null;
function renderGlobalStats(){
	if(!statsUpdater){
		getGlobalStats();
		statsUpdater = setInterval(function(){
			getGlobalStats();
		},1500);
	}
}
function getGlobalStats(){
	Meteor.call('globalMessagesCount',function(err,res){$('#globalMessagesCount').text(res);});
	Meteor.call('globalRoomsCount',function(err,res){$('#globalRoomsCount').text(res);});
	Meteor.call('globalOnlineUsersCount',function(err,res){$('#globalOnlineUsersCount').text(res);});
	Meteor.call('globalRegisteredUsersCount',function(err,res){$('#globalRegisteredUsersCount').text(res);});
}

Template.welcome.rendered = function(){
	renderGlobalStats();

	$('.userinfo:not(.bound)').addClass('bound').bind('click',  function(){ $('.usermenu').toggleClass('show'); });

	$('.Modal:not(.bound)').addClass('bound').bind('click',function(e){e.stopPropagation()});
	$('.toggle-Modal:not(.bound)').addClass('bound').bind('click',function(){$(this).toggleClass('is-Hidden')});

	$('.tipstricks-toggle:not(.bound)').addClass('bound').bind('click',function(){
		// 
		$('#tipstricks-modal.is-Hidden').toggleClass('is-Hidden');
	});
} 


Template.welcome.helpers({
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


Template.welcome.events({
	'click #logout' : function(evnt,tmplt){
		//
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