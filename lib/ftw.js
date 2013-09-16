servert=0,
clientt= Date.now(),
tdiff=0,
messagesLimit=50,
keepaliveTime = 10000,
stick=true,
firstRunAfterMore=false,
loggingOut=false,
lastInsertId=0, //ID of the last inserted message
text='', //current message text
t=0, //current timestamp (synched with server)
latestTimestampAtLoad=0,
animationDuration=250,
message=null,
messagesCount=0,
addedMessages=0;

trolls=[];
allowed=true;

limit = 31, //same as CSS _vars.scss
sidebarWidth = 17, //same as CSS _room.scss
offsetMain = 10;

//used in messages.js to show well, you know..
unreadCount=0;

onlineUsersAutoComplete=[];
onlineUsersIds=[];

notif=null; // holds the notification sound

mSub=null;//maybe that fixes something, i'm the worst programmer ever

onlineUsersObserver=null;

timeref=[];
timeref[31557600000] = 'Long long time ago';
timeref[7776000000] = 'Couple months ago';
timeref[5184000000] = '2 months ago';
timeref[2592000000] = '1 month ago';
timeref[1814400000] = 'Couple weeks ago';
timeref[1209600000] = '2 weeks ago';
timeref[604800000] = '1 week ago';
timeref[259200000] = 'Couple days ago';
timeref[172800000] = '2 days ago';
timeref[86400000] = 'Yesterday';
timeref[43200000] = 'Half a day ago';
timeref[10800000] = 'Couple hours ago';
timeref[7200000] = '2 hours ago';
timeref[3600000] = 'An hour ago';
timeref[1800000] = 'Half an hour ago';
timeref[10000] = 'Ten seconds ago';

currentTimeRef=10000;

console.log('now ' + Date.now());

checkTimeRef = function(timestamp){
	console.log('ts ' + timestamp);
	console.log('ctr ' + currentTimeRef);
	now=Date.now();
	if( timestamp < now - currentTimeRef ){
		console.log('print time ' + timeref[currentTimeRef]);
		currentTimeRef = nextTimeRef(currentTimeRef);
	}else{
		console.log('not print');
	}
}

nextTimeRef = function(timeref){
	var ret = 0;
	switch(timeref){
		case 10000:
			ret=1800000;
			break;
		case 1800000:
			ret=3600000;
			break;
		case 3600000:
			ret=7200000;
			break;
		case 7200000:
			ret=10800000;
			break;
		case 10800000:
			ret=43200000;
			break;
		case 43200000:
			ret=86400000;
			break;
		case 86400000:
			ret=172800000;
			break;
		case 172800000:
			ret=259200000;
			break;
		case 259200000:
			ret=604800000;
			break;
		case 604800000:
			ret=1209600000;
			break;
		case 1209600000:
			ret=1814400000;
			break;
		case 1814400000:
			ret=2592000000;
			break;
		case 2592000000:
			ret=5184000000;
			break;
		case 5184000000:
			ret=7776000000;
			break;
		case 7776000000:
			ret=31557600000;
			break;
		case 31557600000:
			ret=31557600000;
			break;		
	}
	return ret;
}

resetUnreadCount = function(){
	// console.log('resetting unread count');
	unreadCount=0;
	Tinycon.setBubble(0);

	$('.unread').addClass('fadeOffUnread');
}

imageExp = function(){
	$('.message-image').on('click',function(){
		$(this).toggleClass('exp');
	});
}
scrollDown = function(){
	setTimeout(function(){
		$("html, body").scrollTop($('html').height()+1000);
	},0);
}

positionFixedContent = function(){
	//if the room hasn't been rendered (like on the welcome page)
		//there isn't no .online-users-count
	if( !$('.online-users-count').length )return;

	var pcView = limit * 16 + 2*sidebarWidth*16;
	var mobileView = limit * 16 + sidebarWidth * 16  + 2 * 16;
	if($(window).width() > mobileView){
		var l = $('.main').offset().left - sidebarWidth*16 + offsetMain*16 + 1*16 ;
		$('.fixed-sidebar').css( 'left', l );
		$('.online-users-count').css( 'left', l );
		$('.fixed-sidebar-background').width(l+(sidebarWidth-1)*16);
		// $('.toggle-sidebar').css( 'left', l );

		
		if($('.fixed-sidebar').hasClass('show')){
			$('.fixed-sidebar').toggleClass('show');
			$('.main').toggleClass('under-modal');
		}
		if($('#mymessage'))
			$('#mymessage').attr('disabled',false);
	}
	else{
		$('.fixed-sidebar-background').width(0);
		if( $('.toggle-sidebar') && $('.toggle-sidebar').hasClass('left'))
			$('.toggle-sidebar').removeClass('left');
	}

	// $('.mini-header-wrapper').height( $('.online-users').position().top + 0.5*16 );
};

showSidebar = function(){
	// 
	if( !$('.fixed-sidebar').hasClass('show')){
		$('.fixed-sidebar').addClass('show');
		$('.main').addClass('under-modal');
		$('.toggle-sidebar').addClass('left');
		if($('#mymessage'))
			$('#mymessage').attr('disabled',true);
	}
}
hideSidebar = function(){
	// 
	if( $('.fixed-sidebar').hasClass('show')){
		$('.fixed-sidebar').removeClass('show');
		$('.main').removeClass('under-modal');
		$('.toggle-sidebar').removeClass('left');
		if($('#mymessage'))
			$('#mymessage').attr('disabled',false);
	}
}
toggleSidebar = function(){
	if($('.fixed-sidebar').hasClass('show')){
		hideSidebar();
	}else{
		showSidebar();
	}
}


removeLastMessage = function(){
    Messages.remove({_id:''+Session.get('lastInsertId')});
    Session.set('lastInsertId',null);
    $('#mymessage').val('');
}


// renderEmoji = function(){
// 	emojify.run();
// }

//http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript/
escapeHtml = function(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
};
 
// UNSAFE with unsafe strings; only use on previously-escaped ones!
unescapeHtml = function(escapedStr) {
    var div = document.createElement('div');
    div.innerHTML = escapedStr;
    var child = div.childNodes[0];
    return child ? child.nodeValue : '';
};

formatMessage = function(t) {
	t = escapeHtml(t);
	
	t = markdown.parse(t);

	return t;
}

goOnline = function(){
	// console.log('marked as online');
	// console.log('going online with avatar ' + Session.get('avatar'));
	Meteor.call('setUserStatus', Meteor.userId(), Session.get('screenname') ,Session.get('roomid'),Session.get('avatar'),'online');
}

goOffline = function(){
	// console.log('marked as offline');
	Meteor.call('setUserStatus', Meteor.userId(), Session.get('screenname') ,Session.get('roomid'),Session.get('avatar'),'offline');
}


autoCompleteUsername = function(u,a){
	//remove whitespaces
	u = u.replace(/ /g,'');

	//and add a trailing whitespace
	u+=' ';

	//remove the username from the autocomplete list, and then add it again
	//this is total dumbass code
	//in reverse because splice reindexes the array
	for (var i = onlineUsersAutoComplete.length - 1; i > -1; i--) {
	    if (onlineUsersAutoComplete[i].username === u)
	        onlineUsersAutoComplete.splice(i, 1);
	}

	onlineUsersAutoComplete.push({username:u,image:a});

	$('#mymessage').mention({
		emptyQuery: true,
		sensitive : true,
		users: onlineUsersAutoComplete,
		typeaheadOpts: {
	        items: 3 // Max number of items you want to show
	    },
	});
}


getAvatar = function(){
	var avatar='/images/avatar.png';
	if(Meteor.user() && Meteor.user().services){
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
			    if(data.avatar_url)
			    	avatar = data.avatar_url;
		    	Session.set('avatar',avatar);
			});
		}
	}
	Session.set('avatar',avatar);
}