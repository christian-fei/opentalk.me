Meteor.Router.add({'/': function(){
		goOffline();
		Session.set('roomid',null);
		return 'welcome';
	}
});

Meteor.Router.add({'/:id': function(id){
		Session.set('roomid',id);
		goOnline();
		mSub=Meteor.subscribeWithPagination('paginatedMessages',Session.get('roomid'), messagesLimit);
		console.log('we are at ' + this.canonicalPath);
		return 'room';
	}
});

Meteor.Router.add({'/about':'about'});
