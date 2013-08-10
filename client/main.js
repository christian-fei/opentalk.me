/*
set absoluteUrl for setting up the accounts system for the right domain
edit:obsolete now, since no account-system is implemented anymore
*/
console.log(Meteor.absoluteUrl({rootUrl:'http://opentalk.me'}));


var lastInsertId=0, //ID of the last inserted message
	text='', //current message text
	t=0, //current timestamp (synched with server)
	clientt= Date.now(),
	servert=0,
	tdiff=0. //difference between time on server and time on client
	mSub = null, //Messages subscription
	ouSub = null; //OnlineUsers subscription


Meteor.call('serverTime',function(error, result){
	//console.log('server responded with ' + result);
	servert=result;
	tdiff = servert - clientt;
	console.log('tdiff s/c: ' + tdiff);
});


/*sync time*/
function syncTime(){}


/*
UTILITY FUNCTIONS
*/

/*
unsubscribe from subscriptions
*/
function unsubscribe(){
	if(mSub)
	  mSub.stop();
	if(ouSub)
	  ouSub.stop();
}

function subscribe(){
	mSub=Meteor.subscribe('MessagesChatroom',Session.get('roomid'));
	ouSub=Meteor.subscribe('usersOnlineInThisRoom',Session.get('roomid'));
}

/*
USER GOES OFFLINE
*/
/*
-unsubscribe from Messages, OnlineUsers
-remove user from OnlineUsers Collection (Meteor.call)
*/
function goOffline(){
	Meteor.call('setOfflineUser',Session.get('userid'),Session.get('roomid'));
	unsubscribe();
}




function goOnline(){
	if(Meteor._localStorage.getItem('userid') && Meteor._localStorage.getItem('username')){
		Session.set('userid',Meteor._localStorage.getItem('userid'));
		Session.set('username',Meteor._localStorage.getItem('username'));
	}
	if(OnlineUsers.find({userid:Session.get('userid'),username:Session.get('username'),roomid:Session.get('roomid')}).fetch().length === 0){  
		//console.log('setting avatar, because not already online ?!');
		setAvatar();
		//console.log('register online status, because not already online ?!');
		Meteor.call('setOnlineUser',Session.get('userid'),Session.get('username'),Session.get('roomid'));
	}
}



function setAvatar(){
	if(Meteor._localStorage.getItem('avatar'))
		Session.set('avatar',Meteor._localStorage.getItem('avatar'));
	else
		Session.set('avatar','/images/avatar.png');
}



function isValidRoom(r){
	if(r.match(/^[^#\/>]+$/gi))
	  return true;
	return false;
}




/*
USER ENTERS A ROOM

CAUTION:
THE ROOM MUST BEGIN WITH NO SLASH
*/
function joinRoom(r){
	//valid path
	/*
	unsubscribe and go offline from current room
	  This because if condition is true, the user will be subscribed and signed in as online again
	  else it's all ok, since he is in /
	*/
	Session.set('roomid',null);
	if(r === ''){
		Meteor.Router.to('/');
	}
	Session.set('roomid',null);
	unsubscribe();
	goOffline();	
	if(isValidRoom(r)) {
	  console.log('valid path\nrouting to /' + r);
	  Meteor.Router.to('/'+r);
	  Session.set('roomid',r);
	  Meteor._localStorage.setItem('roomid',r);
	  goOnline();
	  subscribe();
	} else {
	  Meteor.Router.to('/');
	  console.log('invalid path or already root\nrouting to /');
	}
}




/*
RESET
-lastInsertId = null, to reset the pointer of the current message //could be left blank, since Session resets after pageload
-TO FIGURE OUT: room in localStorage to Session or not
  -figured out: when the user logs out, clear the roomid in localStorage
-get the username,userid from localStorage
*/
Session.set('lastInsertId',null);
/*
*/





/*
SET UP BASIC ROUTING
*/
Meteor.Router.add({'/about':'about'});
Meteor.Router.add({'/':'welcome'});
/*
there aren't no 404's
except the user types an invalid URL, then he will be redirected to /
*/
Meteor.Router.add({'/*':'room'});

var pathRoot = window.location.pathname,
  	room = pathRoot.substring(1); //path must be trimmed (no slash at beginning)


goOffline();
unsubscribe();
Session.set('roomid',null);

if(isValidRoom(room)) {
	joinRoom(room);
	goOnline();
} else {
}




/*
going offline when the user closes the browser (also at page releod, but that's how onbeforeunload works)
*/
window.onbeforeunload = goOffline;





function distinctUsers(){
	var users = OnlineUsers.find().fetch(),
	    user,
	    distinctUsers=[],
	    du,
	    i=0,
	    j,
	    distinct;

	while(u=users[i++]){
	  j=0;
	  distinct=true;
	  while(du=distinctUsers[j++])
	    if(du.userid === u.userid)
	      distinct=false;
	  if(distinct)
	    distinctUsers.push(u);
	}
	return distinctUsers;
}

Template.room.onlineUsers =function(){
	return distinctUsers();
}
Template.room.onlineUsersCount =function(){
	return distinctUsers().length;
}




Template.pickNickname.events({
	'keyup #nickname': function(evnt,tmplt){
	  if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
	    var nickname = tmplt.find('#nickname').value;
	    if(nickname.length && nickname.indexOf(' ') <= 0) {
	      //TODO: better unique ID
	      //make to string as a (temporary?) fix
	      userid = '' + Date.now() + tdiff;


	      Meteor._localStorage.setItem('username',nickname);
	      Meteor._localStorage.setItem('userid',userid);

	      Session.set('username',nickname);
	      Session.set('userid',userid);

	      goOnline();
	      subscribe();

	      //joinRoom(Session.get('roomid'));
	    } else{
	      //notify
	    }
	  }
	}
});


Template.logout.events({
	'click #logout' : function(evnt,tmplt){
		console.log('logout clicked');
	  evnt.preventDefault();

	  goOffline();

		Meteor._localStorage.removeItem('userid');
		Meteor._localStorage.removeItem('username');
		Session.set('userid',null);
		Session.set('username',null);
		Session.set('roomid',null);

	  //redirect user to /
	  Meteor.Router.to('/');
	}
});









Template.selectChatRoom.events({
	'keyup #roomid': function(evnt,tmplt){
		if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
			var room = tmplt.find('#roomid').value;
			if(isValidRoom(room)){
				joinRoom(room);
			} else {
				//notify
			}
		}
	}
});




/*
global username, either from accounts or nickname
*/
Template.room.username = function(){
	return Session.get('username');
};
Template.room.avatar = function(){
	return Session.get('avatar');
}
Template.room.roomSelected = function(){
	if(Session.get('roomid'))
		return true;
	return false;
}

Template.messages.loggedIn=Template.room.loggedIn=function(){
	if(Session.get('username') && Session.get('userid') && Session.get('roomid'))
		return true;
	return false;
};

function iAmWriting(){
	if(Session.get('lastInsertId'))
	  return true;
	return false;
}

Template.messages.messages = function(){
	var ml = Messages.find({'roomid':Session.get('roomid')}).fetch().length;

	if(iAmWriting()){
	  if(ml <= 1)
	    return [];
	  return Messages.find(
	    {'roomid':Session.get('roomid')}
	    ,{sort: {timestamp: 1},limit:ml -1});
	}else
	  return Messages.find(
	    {'roomid':Session.get('roomid')}
	    ,{sort: {timestamp: 1}}
	  );  
};

function removeLastMessage(){
    Messages.remove({_id:''+Session.get('lastInsertId')});
    Session.set('lastInsertId',null);
    $('#mymessage').val('');
}

Template.messages.events({
	'keyup #mymessage' : function(evnt,tmplt){
		console.log('k ' + evnt.keyCode);

	    text = tmplt.find('#mymessage').value;
	    t= Date.now() + tdiff;

    	if(!text.trim().length){
    		removeLastMessage();
    		return;
    	}


	    /*First message/first keystroke being sent*/
	    if(!Session.get('lastInsertId')){
	    	console.log('=====================');
	    	console.log('      new message   ');
	    	console.log('=====================');
			Session.set(
				'lastInsertId',
				Messages.insert(
					{
					userid:Session.get('userid')
					,username:Session.get('username')
					,roomid:Session.get('roomid')
					,text:text
					,timestamp:t
					}
				)
			);
	      	return;
	    }

	    if(evnt.keyCode === 13){
			if(text.length){
				//new Message
				Session.set('lastInsertId',null);
				tmplt.find('#mymessage').value = '';
			} else {
				removeLastMessage();
			}
	    } else {
			if(text.length){
				Messages.update(
					{
						_id:''+Session.get('lastInsertId')
					}
					,{$set : 
						{
							text:text
							,timestamp:t
						}
					}
				);
			} else {
				removeLastMessage();
			}
	    }
		scrollToBottom();
	},

	'click #deleteMyMessages' : function(evnt,tmplt){
		evnt.preventDefault();
		if(confirm('Do you want to remove your messages from this room?')){
			Meteor.call('removeMessagesOfUserInRoom',Session.get('userid'),Session.get('roomid'));
		}
	}

});

function fixSidebar(){
	var limit = 35, //same as CSS _vars.scss
		sidebarWidth = 12; //same as CSS _room.scss
	var pcView = limit * 16 + 2*sidebarWidth*16;
	console.log(pcView);
	if($(window).width() > pcView){
		console.log('pc view');
		var l = $('.main').offset().left - sidebarWidth*16;
		console.log(l);
		$('.fixed-sidebar').css( 'left', l );
	}
	else
		$('.fixed-sidebar').css( 'left', '-100%' );
};
Template.room.rendered = function(){


	fixSidebar();
	
	
	$('#mymessage').focus();
	$('#nickname').focus();

	scrollToBottom();
}


function scrollToBottom(){
	$('html,body').animate({scrollTop:50000},10);
}

Meteor.startup(function(){
	$(document).ready(function() {
		
		$(window).resize(function(){
			fixSidebar();
		});

		$('#roomid').focus();

		$('.blanket').on('click',function(){
			$('#roomid').focus();
		});


		if(!Modernizr.input.placeholder){
			console.log('there ain\'t no placeholder support in your shitty browser, dude');
			$('[placeholder]').focus(function() {
			var input = $(this);
			if (input.val() == input.attr('placeholder')) {
				input.val('');
				input.removeClass('placeholder');
			}
			}).blur(function() {
				var input = $(this);
				if (input.val() == '' || input.val() == input.attr('placeholder')) {
					input.addClass('placeholder');
					input.val(input.attr('placeholder'));
				}
			}).blur();
			$('[placeholder]').parents('form').submit(function() {
				$(this).find('[placeholder]').each(function() {
					var input = $(this);
					if (input.val() == input.attr('placeholder')) {
						input.val('');
					}
				})
			});
		}
	});
});