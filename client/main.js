/*
set absoluteUrl for setting up the accounts system for the right domain
edit:obsolete now, since no account-system is implemented anymore
*/
Meteor.absoluteUrl({rootUrl:'http://opentalk.me'})


var lastInsertId=0, //ID of the last inserted message
	text='', //current message text
	t=0, //current timestamp (synched with server)
	clientt= Date.now(),
	servert=0,
	tdiff=0. //difference between time on server and time on client
	mSub = null, //Messages subscription
	ouSub = null, //OnlineUsers subscription
	keepaliveTime = 10000;


if(Meteor._localStorage.getItem('realtimeEnabled'))
	Session.set('realtimeEnabled',Meteor._localStorage.getItem('realtimeEnabled'));
else{
	Session.set('realtimeEnabled',false);
}

Deps.autorun(function(){
	if( Meteor.user() ) {
		var currentUser = Meteor.users.find().fetch()[0];
		Meteor.subscribe('userData');
		Session.set('userid',currentUser._id);
		Session.set('username',currentUser.profile.name);
		goOnline();
	    subscribe();
	    setAvatar();
	}
});

var pathRoot = window.location.pathname,
  	room = pathRoot.substring(1); //path must be trimmed (no slash at beginning)


var limit = 32, //same as CSS _vars.scss
	sidebarWidth = 12; //same as CSS _room.scss

Meteor.call('serverTime',function(error, result){
	//console.log('server responded with ' + result);
	servert=result;
	tdiff = servert - clientt;
	//console.log('tdiff s/c: ' + tdiff);
});

Meteor.setInterval(function () {
	if(Session.get('roomid')){
		//console.log('sending keep alive command');
		Meteor.call('setUserStatus',Session.get('userid'),Session.get('username'),Session.get('roomid'),'online');
	}
}, keepaliveTime);



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
	Meteor.call('setUserStatus',Session.get('userid'),Session.get('username'),Session.get('roomid'),'offline');
	Session.set('roomid',null);
	//unsubscribe();
}




function goOnline(){
	if(Meteor._localStorage.getItem('userid') && Meteor._localStorage.getItem('username')){
		Session.set('userid',Meteor._localStorage.getItem('userid'));
		Session.set('username',Meteor._localStorage.getItem('username'));
	}
	if(OnlineUsers.find({userid:Session.get('userid'),roomid:Session.get('roomid')}).fetch().length === 0){  
		setAvatar();
		Meteor.call('setUserStatus',Session.get('userid'),Session.get('username'),Session.get('roomid'),'online');
	}
}


function setAvatar(){
	if( Meteor.user() ){
		if(Meteor.user().services){
			if(Meteor.user().services.twitter)
				Session.set('avatar',Meteor.user().services.twitter.profile_image_url);
			if(Meteor.user().services.google)
				Session.set('avatar',Meteor.user().services.google.picture);
			if(Meteor.user().services.facebook)
				Session.set('avatar','https://graph.facebook.com/'+Meteor.user().services.facebook.username+'/picture');
			if(Meteor.user().services.github){
				//make ajax call to get profile image
				var gh_api_url = 'https://api.github.com/users/' + Meteor.user().services.github.username;
				console.log('ajax to gh');
				$.ajax({
				  url: gh_api_url
				}).done(function ( data ) {
				  if( console && console.log ) {
				    console.log("data:", data);
				    if(data.avatar_url)
				    	Session.set('avatar',data.avatar_url);
				  }
				});
			}
		}
	}else{
		Session.set('avatar','/images/avatar.png');
	}
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

	goOffline();
	unsubscribe();
	Session.set('roomid',null);

	if(r === ''){
		Meteor.Router.to('/');
	}
	if(isValidRoom(r)) {
	  //console.log('valid path\nrouting to /' + r);
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




if(isValidRoom(room)) {
	

	joinRoom(room);
	goOnline();
} else {

}




/*
going offline when the user closes the browser (also at page releod, but that's how onbeforeunload works)
*/
window.onbeforeunload = function(){
	goOffline();
	return null;
}


/*
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
}*/

Template.room.onlineUsers =function(){
	return OnlineUsers.find().fetch();
//	return distinctUsers();
}
Template.room.onlineUsersCount =function(){
	return OnlineUsers.find().fetch().length;
//	return distinctUsers().length;
}
Template.room.realtimeEnabled = function(){
	return Session.get('realtimeEnabled') ? 'on' : 'off';
}

function validNickname(n){
	if(n.length && n.length < 25 && n.charAt(n.length - 1) !== ' ' && n.trim().length && nicknameAvailable(n))
		return true;
	return false;
}

function nicknameAvailable(n){
	if(OnlineUsers.find({nickname:n}).fetch().length === 0)
		return true;
	return false;
}

Template.pickNickname.events({
	'keyup #nickname': function(evnt,tmplt){
	  if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
	    var nickname = tmplt.find('#nickname').value;

	    if(validNickname(nickname)) {
	      //TODO: better unique ID
	      //make to string as a (temporary?) fix
	      var uid = Date.now() + tdiff;
	      userid = '' + uid;


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
		if(Meteor.user())
			Meteor.logout(function(){
				Session.set('userid',null);
				Session.set('username',null);
			});

		Meteor._localStorage.removeItem('avatar');
		Meteor._localStorage.removeItem('userid');
		Meteor._localStorage.removeItem('username');
		Session.set('userid',null);
		Session.set('username',null);
		//Session.set('roomid',null);

		//redirect user to /
		//Meteor.Router.to('/');
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
function showSidebar(){
	if( !$('.fixed-sidebar').hasClass('show') && $(window).width() < limit*16 + sidebarWidth*2*16 ){
		$('.fixed-sidebar').addClass('show');
		$('.main').addClass('under-modal');
		$('.toggle-sidebar').addClass('left');
		if($('#mymessage'))
			$('#mymessage').attr('disabled',true);
		if($('#nickname'))
			$('#nickname').attr('disabled',true);
	}
}
function hideSidebar(){
	if( $('.fixed-sidebar').hasClass('show') && $(window).width() < limit*16 + sidebarWidth*2*16 ){
		$('.fixed-sidebar').removeClass('show');
		$('.main').removeClass('under-modal');
		$('.toggle-sidebar').removeClass('left');
		if($('#mymessage'))
			$('#mymessage').attr('disabled',false);
		if($('#nickname'))
			$('#nickname').attr('disabled',false);
	}
}


function toggleSidebar(){
	if($('.fixed-sidebar').hasClass('show')){
		hideSidebar();
	}else{
		showSidebar();
	}
	
}

Template.room.events({
	'click .toggle-sidebar' : toggleSidebar,
	'click #toggleRealtime' : function(evnt,tmplt){
		evnt.preventDefault();
		Session.set('realtimeEnabled' , !Session.get('realtimeEnabled'));
		Meteor._localStorage.setItem('realtimeEnabled',Session.get('realtimeEnabled'));
	}
});


Template.messages.loggedIn=Template.room.loggedIn=function(){
	if(Session.get('username') && Session.get('userid'))
		return true;
	return false;
};

function iAmWriting(){
	var mslength = Messages.find().fetch().length,
		lastMessage = Messages.find().fetch()[mslength - 1];
	if(mslength > 0 && Session.get('lastInsertId') == lastMessage._id)
		return true;
	return false;
	/*
	if(Session.get('lastInsertId'))
	  return true;
	return false;
	*/
}

/*
Template.messages.preserve({
	'.message' : function(node){console.log(node)}
});
*/

/*Template.messages.myif = function(data,options){
	console.log(data());
	console.log(options);
}
*/


Template.messages.messages = function(){

	//if in realtime, 
		//if my last message has not been completed yet, don't display it.
		//in other words, don't display message that are mine and not completed


	if(Session.get('realtimeEnabled')) {
		if( Session.get('lastInsertId') )
			return Messages.find( {_id: {$ne: Session.get('lastInsertId')} },{sort:{timestamp:1}} );
		return Messages.find({},{sort:{timestamp:1}});
		/*var mylastmessage = Messages.find({userid:Session.get('userid')},{sort:{timestamp:-1},limit:1}).fetch()[0];
		if(mylastmessage && mylastmessage._id === Session.get('lastInsertId'))
			return Messages.find({},{limit: Messages.find({}).fetch().length -1 });
		return Messages.find({},{});*/
	}
	else{
		return Messages.find({messageComplete:true},{sort:{timestamp:1}});
	}
	

	/*
	var ml = Messages.find({},{fields:{_id:true}}).fetch().length;

	if(iAmWriting()){
		if(ml <= 1)
			return [];
		if(!Session.get('realtimeEnabled'))
			return Messages.find(
				{messageComplete:true}
				,{fields:{username:true,text:true},sort: {timestamp: 1},limit:ml -1}
			);
		return Messages.find(
			{}
			,{fields:{username:true,text:true},sort: {timestamp: 1},limit:ml -1}
		);
	}else{
		if(!Session.get('realtimeEnabled'))
			return Messages.find(
				{messageComplete:true}
				,{fields:{username:true,text:true},sort: {timestamp: 1}}
			);*		return Messages.find(
			{}
			,{fields:{username:true,text:true},sort: {timestamp: 1}}
		);  
	}
	*/
};

function removeLastMessage(){
    Messages.remove({_id:''+Session.get('lastInsertId')});
    Session.set('lastInsertId',null);
    $('#mymessage').val('');
}



Template.messages.events({
	'keyup #mymessage' : function(evnt,tmplt){

	    text = tmplt.find('#mymessage').value;
	    t= Date.now() + tdiff;

    	if(!text.trim().length){
    		removeLastMessage();
    		return;
    	}
    	if(Session.get('realtimeEnabled')) {
    		/*First message/first keystroke being sent*/
		    if(!Session.get('lastInsertId')){
				Session.set(
					'lastInsertId',
					Messages.insert(
						{
						userid:Session.get('userid')
						,username:Session.get('username')
						,roomid:Session.get('roomid')
						,text:text
						,timestamp:t
						,messageComplete:false
						}
					)
				);
		      	return;
		    }
		    if(evnt.keyCode === 13){
				if(text.length){
					//new Message
					Messages.update(
						{
							_id:''+Session.get('lastInsertId')
						}
						,{$set : 
							{
								text:text
								,timestamp:t
								,messageComplete:true
							}
						}
					);
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
    	} else {
			Messages.remove({_id:Session.get('lastInsertId')});
			Session.set('lastInsertId',null);
    		if(evnt.keyCode === 13){
	    		Messages.insert(
					{
					userid:Session.get('userid')
					,username:Session.get('username')
					,roomid:Session.get('roomid')
					,text:text
					,timestamp:t
					,messageComplete:true
					}
				);
				tmplt.find('#mymessage').value = '';
	    	}
    	}
	    

	    
		scrollIfAtBottom();
	}
});


/*weird hack to scrollDown only once, and not at each rerendering of Template.room*/
function scrollAndFocus(){
	//console.log($('body').outerHeight());
	if( $('body').outerHeight() > 300 ){
		//console.log('scroll');
		$('html,body').animate({scrollTop: $('html,body').outerHeight()},200);
	}
	$('#mymessage').focus();
}

function scrollIfAtBottom(){
	if( $(window).scrollTop() + $(window).height()  > $(document).height() - 200) {
		//console.log('scrolling because at bottom');
		$('html,body').animate({scrollTop: $('html,body').outerHeight()},10);
		$('#mymessage').focus();
	}
}

function positionFixedContent(){
	if( !$('.online-users-count') )return;

	var pcView = limit * 16 + 2*sidebarWidth*16;
	if($(window).width() > pcView){
		var l = $('.main').offset().left - sidebarWidth*16;
		$('.fixed-sidebar').css( 'left', l );
		$('.online-users-count').css( 'left', l );

		if($('.fixed-sidebar').hasClass('show')){
			$('.fixed-sidebar').toggleClass('show');
			$('.main').toggleClass('under-modal');
		}
	}
	else{
		if( $('.toggle-sidebar') && $('.toggle-sidebar').hasClass('left'))
			$('.toggle-sidebar').removeClass('left');
	}
};

var firstRun = 0;
Template.room.rendered = function(){
	//console.log('room ============rendered=============');
	positionFixedContent();
	var instnc = this;

	if(instnc.find('#mymessage') && !instnc.find('#nickname') && firstRun < 2 ){
		scrollAndFocus();
	}
	scrollIfAtBottom();
	firstRun++;

	if($('#nickname')){
		$('#nickname').focus();

		$('.blanket-white').on('click',function(){		
			instnc.find('#nickname').focus();
		});
	}

	
};

Template.welcome.rendered = function(){
	goOffline();

	$('#roomid').focus();

	$('.blanket').on('click',function(){
		$('#roomid').focus();
	});
	
};




Meteor.startup(function(){

	FastClick.attach(document.body);

	$(document).ready(function() {
		
		
		

		$(window).resize(function(){
			positionFixedContent();
		});

		$(document).wipetouch({
			preventDefault:false,
			wipeLeft: function(result) {
				hideSidebar();
			},
			wipeRight: function(result) {
				showSidebar();
			}
		});

	});


	if(!Modernizr.input.placeholder){
		//console.log('there ain\'t no placeholder support in your shitty browser, dude');
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