Meteor.Router.add({'/': function(){
		goOffline();
		Session.set('roomid',null);
		ouSub.stop();
		return 'welcome';
	}
});

Meteor.Router.add({'/:id': function(id){
		Session.set('roomid',id);
		goOnline();
		ouSub=Meteor.subscribe('usersOnlineInThisRoom',Session.get('roomid'));
		mSub=Meteor.subscribeWithPagination('paginatedMessages',Session.get('roomid'), messagesLimit);
		console.log('we are at ' + this.canonicalPath);
		return 'room';
	}
});

Meteor.Router.add({'/about':'about'});
