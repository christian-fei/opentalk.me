var alreadyTracked=[];

Meteor.Router.add({'/': function(){
		if(onlineUsersObserver){
			onlineUsersObserver.stop();
		}
		goOffline();
		//reset
		Session.set('roomid',null);
		if(!alreadyTracked['/'] && window.location.hostname === 'opentalk.me' && Meteor.userId() !== 'AZHSZ59HnHn2qiKW5'){
                mixpanel.track('landing');
                alreadyTracked['/']=true;
        }
        onlineUsersAutoComplete=[];
		return 'welcome';
	}
});

Meteor.Router.add({'/profile':function(){
		if(onlineUsersObserver){
			onlineUsersObserver.stop();
		}
		goOffline(); //because you're not anymore in the room
		Session.set('roomid',null);
		//reset
		if(!alreadyTracked['/profile'] && window.location.hostname === 'opentalk.me' && Meteor.userId() !== 'AZHSZ59HnHn2qiKW5'){
	            mixpanel.track('profile');
	            alreadyTracked['/profile']=true;
	    }
	    onlineUsersAutoComplete=[];
		return 'profile';
	}
});


Meteor.Router.add({'/:id': function(id){
		//reset


		Session.set('roomid',id);
		prevUserId=prevId=null;
		goOnline();
		ouSub=Meteor.subscribe('usersOnlineInThisRoom',Session.get('roomid'));
		mSub=Meteor.subscribeWithPagination('paginatedMessages',Session.get('roomid'), messagesLimit);
		if( $('#mymessage') )
			$('#mymessage').focus();
		if(!alreadyTracked[id] && window.location.hostname === 'opentalk.me' && Meteor.userId() !== 'AZHSZ59HnHn2qiKW5'){
			mixpanel.track(
			    'room',
			    { 'roomid': id }
			);
			alreadyTracked[id]=true;			
		}
		return 'room';
	}
});
