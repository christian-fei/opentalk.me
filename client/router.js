Meteor.Router.add({'/': function(){
		goOffline();
		//reset
		$('html').css({'overflow':'auto'});
		Session.set('roomid',null);
		return 'welcome';
	}
});

Meteor.Router.add({'/profile':function(){
		//reset
		$('html').css({'overflow':'auto'});
		return 'profile';
	}
});

Meteor.Router.add({'/:id': function(id){
		//reset
		$('html').css({'overflow':'auto'});
		Session.set('roomid',id);
		goOnline();
		ouSub=Meteor.subscribe('usersOnlineInThisRoom',Session.get('roomid'));
		mSub=Meteor.subscribeWithPagination('paginatedMessages',Session.get('roomid'), messagesLimit);
		console.log('we are at ' + this.canonicalPath);
		if( $('#mymessage') )
			$('#mymessage').focus();
		return 'room';
	}
});
