var alreadyTracked=[];

Meteor.Router.add({'/': function(){
		goOffline();
		//reset
		$('html').css({'overflow':'auto'});
		Session.set('roomid',null);
		if(!alreadyTracked['/']){
                console.log('tracking /');
                mixpanel.track('landing');
                alreadyTracked['/']=true;
        }
        
		return 'welcome';
	}
});

Meteor.Router.add({'/profile':function(){
		//reset
		$('html').css({'overflow':'auto'});
		console.log('pageview profile');
		if(!alreadyTracked['/profile']){
	            console.log('tracking /profile');
	            mixpanel.track('profile');
	            alreadyTracked['/profile']=true;
	    }
		return 'profile';
	}
});

//hack because of reactivity sources

Meteor.Router.add({'/:id': function(id){
		//reset
		$('html').css({'overflow':'auto'});
		Session.set('roomid',id);
		prevUserId=prevId=null;
		goOnline();
		ouSub=Meteor.subscribe('usersOnlineInThisRoom',Session.get('roomid'));
		mSub=Meteor.subscribeWithPagination('paginatedMessages',Session.get('roomid'), messagesLimit);
		console.log('we are at ' + this.canonicalPath);
		if( $('#mymessage') )
			$('#mymessage').focus();
		if(!alreadyTracked[id]){
			console.log('tracking /' + id);
			mixpanel.track(
			    'room',
			    { 'roomid': id }
			);
			alreadyTracked[id]=true;			
		}
		return 'room';
	}
});
