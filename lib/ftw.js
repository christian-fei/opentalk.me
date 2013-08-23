servert=0,
	clientt= Date.now(),
	tdiff=0,
	messagesLimit=40,
	keepaliveTime = 10000,
	stick=true,
	firstRunAfterMore=false,
	loggingOut=false,
	yoro=false;


lastInsertId=0, //ID of the last inserted message
text='', //current message text
t=0, //current timestamp (synched with server)
messagesLimit=40,
latestTimestampAtLoad=0,
animationDuration=250,
firstRunAfterMore=true,
message=null,
messagesCount=0,
addedMessages=0;

limit = 32, //same as CSS _vars.scss
sidebarWidth = 15; //same as CSS _room.scss

imageExp = function(){
	$('.message-image').on('click',function(){
		// console.log('exp');
		// console.log( $(this) );
		$(this).toggleClass('exp');
		// if( $(this).hasClass('exp') )
		// 	$(this).removeClass('exp');
		// else
		// 	$(this).addClass('exp');
	});
}
scrollDown = function(){
	setTimeout(function(){
		$("html, body").scrollTop($('html').height()+1000);
	},0);
}

positionFixedContent = function(){
	//if the room hasn't been rendered (like on the welcome page)
		//there ain't no .online-users-count
	if( !$('.online-users-count').length )return;

	var pcView = limit * 16 + 2*sidebarWidth*16;
	if($(window).width() > pcView){
		var l = $('.main').offset().left - sidebarWidth*16;
		$('.fixed-sidebar').css( 'left', l );
		$('.online-users-count').css( 'left', l );
		// $('.toggle-sidebar').css( 'left', l );

		
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

showSidebar = function(){
	// 
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
hideSidebar = function(){
	// 
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
	var imagePattern = /(^|\s)(https?:\/\/[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?\.(?:png|jpg|jpeg|gif|bmp|svg))/gm;
	t = t.replace(imagePattern, " <div class='message-image-wrapper'><a href='$2' title='open in a new page' class='open-in-new-tab' target='_blank'></a><img src='$2' class='message-image'/></div>  ");
	var urlPatternWithProtocol = /(^|\s)(https?:\/\/[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gm;
	t = t.replace(urlPatternWithProtocol, "  <a href='$2' rel='noindex,nofollow' target='_blank'>$2</a>  ");
	var urlPatternWithoutProtocol = /(^|\s)([\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gm;
	t = t.replace(urlPatternWithoutProtocol, "  <a href='http://$2' rel='noindex,nofollow' target='_blank'>$2</a>  ");
	t = t.replace(/\n/g,'<br>');
	t = markdown.parse(t);
	return t;
}

goOnline = function(){
	console.log('going online');
	Meteor.call('setUserStatus', Meteor.userId(), Session.get('screenname') ,Session.get('roomid'),'online');
}

goOffline = function(){
	console.log('going offline');
	Meteor.call('setUserStatus', Meteor.userId(), Session.get('screenname') ,Session.get('roomid'),'offline');
}