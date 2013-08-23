var initialMessageHeight = 0;
Template.messages.events({
	'keyup #mymessage' : function(evnt,tmplt){

		// console.log(evnt.keyCode);
		// console.log(evnt.which);

	    text = tmplt.find('#mymessage').value;
	    t= Date.now() + tdiff;

    	if(!text.trim().length){
    		removeLastMessage();
    		return;
    	}

    	text = text.substring(0,text.length);

    	/*
		working in Chrome 28.0.1500.95
    	*/
    	var mm=$('#mymessage')[0],
    		hackOffset = 0;
    	if(navigator.userAgent.indexOf('Firefox') >=0){
    		hackOffset=32;
    		//console.log('firefox');
    	}
    	if(initialMessageHeight===0)
    		initialMessageHeight = mm.offsetHeight;
    	if(mm.scrollHeight > initialMessageHeight)
	    	mm.style.height = mm.scrollHeight + hackOffset + 'px';
    	
    	// console.log('offsetheight ' + initialMessageHeight);
    	// console.log('scrollheight ' + mm.scrollHeight);
    	// console.log('offsetheight ' + mm.offsetHeight);



    	if(Session.get('realtimeEnabled')) {
    		/*First message/first keystroke being sent*/
		    if(!Session.get('lastInsertId')){
				Session.set(
					'lastInsertId',
					Messages.insert(
						{
						userid:Meteor.userId()
						,username:Meteor.user().profile.name
						,roomid:Session.get('roomid')
						,text:text
						,timestamp:t
						,messageComplete:false
						,useravatar:Session.get('avatar')
						}
					)
				);
		      	return;
		    }
		    text = formatMessage(text);
		    if(evnt.keyCode === 13){

				if(text.length){
					//format message, strip tags and shit
					
					//console.log(text);
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
					//new Message
					Session.set('lastInsertId',null);
					tmplt.find('#mymessage').value = '';
				} else {
					removeLastMessage();
				}
				mm.style.height = initialMessageHeight + 'px';
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
					mm.style.height = initialMessageHeight + 'px';
				}
		    }

    	} else {
    		if(Session.get('lastInsertId') !== null){
				Messages.remove({_id:Session.get('lastInsertId')});
				Session.set('lastInsertId',null);
    		}
    		if(evnt.keyCode === 13){
    			text = formatMessage(text);
	    		Messages.insert(
					{
					userid:Meteor.userId()
					,username:Meteor.user().profile.name
					,roomid:Session.get('roomid')
					,text:text
					,timestamp:t
					,messageComplete:true
					,useravatar:Session.get('avatar')
					}
				);
				mm.style.height = initialMessageHeight + 'px';
				//console.log('resetting textarea to ' + initialMessageHeight)
				$('#mymessage').val('');

	    	}
    	}
    	setTimeout(function(){
    		scrollDown();
    	},0);
	}
});


Meteor.startup(function(){
	mPagination=null;
});


function renderMessages(){
	if(mPagination)
		mPagination.stop();
	var prevUserId=prevId=null;
	console.log('observing');
	mPagination=Messages.find({},{sort:{timestamp:1}}).observeChanges({
		addedBefore: function(id, fields,before){
			// console.log('added id ' +id + ' before ' + before);

			// $('.load-more').removeClass('show-loading');

			/*if I write and the message is not complete, don't add it to the list, only as soon as it changed status to messageComplete=true*/
			// console.log( typeof fields.userid );
			// console.log( typeof Meteor.userId() );
			if(fields.userid === Meteor.userId() && fields.messageComplete===false)return;
			/*if I don't want realtime messages why should I render them if they are not complete YET??! Huh?*/
			if(!Session.get('realtimeEnabled') && fields.messageComplete===false)return;
			
			message = $('<li class="message" id="'+id+'"><span class="avatar"></span><b class="username">'+fields.username+'</b><p class="text">'+fields.text+'</p></li>');

			if(before === null) {
				//items of first load and recently typed ones
				// message.hide();
				$('#last').before(message);
				// console.log('prevUserId ' +prevUserId);
				// console.log('currUser ' +fields.username);
				if(prevUserId===null || prevUserId!==fields.userid){
					//A NEW USER
					message.addClass('diffUser');
					message[0].firstChild.style.backgroundImage='url("' + fields.useravatar + '")';
					message[0].firstChild.classList.add('avatar-border');
					message[0].firstChild.classList.add('tip');
					// message[0].firstChild.setAttribute('data-tip',fields.username);

					$('#'+prevId).addClass('lastOfUser');
				}
				message[0].classList.add('new-message');
				//since all the message that have before === null are at the bottom, thisis a new message => display it like one
				// message.addClass('realtime').fadeIn(animationDuration,function(){if(stick && Session.get('userid'))scrollDown()});
			}else{
				// var offsetBottom = $('body').height() - $('body').scrollTop();
				var offsetBottom = document.body.offsetHeight - document.body.scrollTop;

				// console.log('old ' + id + ' prevUserId ' + prevUserId);
				//items of load-more+
				// message.hide();
				$('#'+before).before(message);
				//it is at the bottom of the list, so add lastOfUser class
			
				// console.log('=========');
				// console.log(fields.username);
				// console.log(prevUserId);
				// console.log('=========');
				message[0].firstChild.style.backgroundImage='url("'+fields.useravatar+'")';
							
				// message[0].firstChild.classList.add('avatar-border');
				// message[0].firstChild.classList.add('tip');
				// message[0].firstChild.setAttribute('data-tip',fields.username);				
				// message[0].firstChild.classList.add('avatar-border');

				if(firstRunAfterMore){
					message.addClass('lastOfUser');
					firstRunAfterMore=false;
					
				}else{
					if(prevUserId!==fields.userid){
						/*NEW USER*/
						message.addClass('lastOfUser');
						if(message.next()[0]){
							message.next().addClass('diffUser');
							message.next()[0].firstChild.classList.add('avatar-border');
							message.next()[0].firstChild.classList.add('tip');
						}
					}else{
						/*SAME USER*/
						message.addClass('diffUser');
						if(message.next()[0]){
							message.next().removeClass('diffUser');
							message.next()[0].firstChild.style.backgroundImage='none';
							message.next()[0].firstChild.classList.remove('avatar-border');
							message.next()[0].firstChild.classList.remove('tip');
						}

					}
				}
				// message.delay(100).fadeIn(animationDuration,function(){if(stick && Session.get('userid'))scrollDown()});
				
				//let's see if this fixes the issue on android
				// setTimeout(function(){
				// 	$('body').scrollTop( $('body').height() - offsetBottom );
				// },2000);
			
				document.body.scrollTop = document.body.offsetHeight - offsetBottom;
			}

			prevUserId=fields.userid;
			prevId=id;

			// tiprAll();
			imageExp();
			
			if(stick)scrollDown();
		},
		changed: function(id,fields){
			// console.log('changed ' + id + ' to ' + fields.text);
			// console.log( $('#mymessage').val() );
			// console.log('lid ' +Session.get('lastInsertId'));
			// console.log(fields);
			// console.log('changed & lmu ' + prevUserId);
			if( $('#'+id).length ){
				//update existing message
				if(fields.text !== undefined)
					$('#'+id+' .text').html( fields.text );
			}else 
			if(fields.messageComplete === true){
				console.log('message completed');
				var mfdb = Messages.find({_id:id}).fetch()[0];
				// console.log(mfdb);
				if(prevUserId===mfdb.userid){
					message = $('<li class="message new-message" id="'+id+'"><span class="avatar"></span><b class="username">'+mfdb.username+'</b><p class="text">'+mfdb.text+'</p></li>');
				}
				else{
					$('#'+prevId).addClass('lastOfUser');
					message = $('<li class="message diffUser new-message" id="'+id+'"><span class="avatar avatar-border tip" style="background:url('+mfdb.useravatar+')"></span><b class="username">'+mfdb.username+'</b><p class="text">'+ mfdb.text +'</p></li>');
				}
				prevUserId=mfdb.userid;
				prevId=id;
				// if(!prevUserId)prevUserId=fields.username;
				// message.hide();
				$('#last').before(message);
				// tiprAll();
				// message.addClass('realtime').fadeIn(animationDuration,function(){if(stick && Session.get('userid'))scrollDown()});	
			}
			imageExp();
			if(stick)
				scrollDown();
		},
		movedBefore: function(id,before){
			// console.log(id + ' changed position to ' + before);
			//kinda works, but only if the moved element has an avatar, else it's moved withouth
			// if(before===null){
			// 	$('#'+id).slideUp(animationDuration, function(){ $(this).insertBefore($('#last')) }).slideDown(animationDuration);
			// }
		},
		removed: function(id){
			// if(id === $('.messages li').first().attr('id'))
			// 	return;

			console.log('removed ' + id);
			// console.log('prevId ' + prevId);

			// console.log( $('#last').prev().attr('id') );

			if(id === $('#last').prev().attr('id')){
				prevUserId=prevId=null;
			}
			//if the next element in the list has an empty background it means it is from the same user, apply the image from this element (id) to it
			if( $('#'+id).next()[0] !== undefined && $('#'+id).next()[0] !== null &&  $('#'+id).next()[0].id !== 'last'){
				if( $('#'+id + ' .username').html() === $('#'+id).next()[0].querySelector('.username').innerHTML ){
					var bckpBg = $('#'+id)[0].firstChild.style.backgroundImage;
					$('#'+id).next()[0].firstChild.style.backgroundImage=bckpBg;
					$('#'+id).next()[0].firstChild.classList.add('avatar-border');
					$('#'+id).next().addClass('diffUser');
					$('#'+id).next()[0].firstChild.classList.add('tip');
					// $('#'+id).next()[0].firstChild.setAttribute('data-tip',$('#'+id + ' .username').html());
					// tiprAll();
				}else{
					console.log('strange behaviour');
				}
			}
			$('#'+id).remove();
		}
	});
}

Template.messages.rendered=function(){
	console.log('messages rendered');
	// console.log(mSub);
	renderMessages();
	if(stick){
		//console.log('scrolling because stick');
		scrollDown();
		//this.find('#mymessage').focus();
	}
	$(window).scroll(function (e) {
		if( $(window).scrollTop() < 300 ){
			if(!mSub.loading() && Messages.find().count() < mSub.loaded() ) {
				console.log('all messages loaded');
				$('.loading').removeClass('show-loading');
			}else{
				console.log('load more messages');
				mSub.loadNextPage();
			}
		}
		if($(window).scrollTop() + $(window).height()  < $(document).height() - 100){
			stick = false;
		}else{
			stick=true;
		}
	});
}