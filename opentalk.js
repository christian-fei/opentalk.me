Messages = new Meteor.Collection('Messages');
OnlineUsers = new Meteor.Collection('OnlineUsers');

if(Meteor.isClient) {
  /*
    set absoluteUrl for setting up the accounts system for the right domain
  */
  console.log(Meteor.absoluteUrl({rootUrl:'http://opentalk.me'}));


<<<<<<< HEAD
  var lastInsertId=0, //ID of the last inserted message
  text='', //current message text
  t=0, //current timestamp
  mSub, //Message subscription
  ouSub; //OnlineUsers subscription



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

  /*
  USER GOES OFFLINE
  */
  /*
    -remove user from OnlineUsers Collection (Meteor.call)
    -unsubscribe from Messages, OnlineUsers
  */
  function goOffline(){
    unsubscribe();
    Meteor.call('removeOnlineUserFromRoom',Session.get('userid'),Session.get('roomid'));
    Meteor.call('clog','logging out');
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
  function routeToRoom(r){
    //valid path
    Session.set('roomid',null);
    Meteor._localStorage.removeItem('roomid');    
    if(isValidRoom(r)) {
      console.log('valid path\nrouting to /' + r);
      Meteor.Router.to('/'+r);
      Session.set('roomid',r);
      Meteor._localStorage.setItem('roomid',r);
    } else {
      Meteor.Router.to('/');
      console.log('invalid path or already root\nrouting to /');
    }
  }
  


  /*
    -unsubscribe from previous rooms
    -Session roomid will be set
    -manage subscriptions
  */
  function subscribeToRoom(r){
    if(isValidRoom(r)) {
      unsubscribe();
      Session.set('roomid',r);
      Meteor._localStorage.setItem('roomid',r);
      mSub=Meteor.subscribe('MessagesChatroom',r);
      ouSub = Meteor.subscribe('usersOnlineInThisRoom',r);
    }
  }
=======




>>>>>>> 8a180cf8c2f292504c1f22d5e934eb2a760a89b4




  /*
<<<<<<< HEAD
    RESET
    -lastInsertId = null, to reset the pointer of the current message //could be left blank, since Session resets after pageload
    -TO FIGURE OUT: room in localStorage to Session or not
      -figured out: when the user logs out, clear the roomid in localStorage
    -get the username,userid from localStorage
  */
  Session.set('lastInsertId',null);
/*
*/
  if(Meteor._localStorage.getItem('roomid'))
    Session.set('roomid',Meteor._localStorage.getItem('roomid'));
=======
  restoring the previous session
  I'm attaching the values of localStorage to the session,
    to enable the reactivity sources (like Session) of Meteor
  */

>>>>>>> 8a180cf8c2f292504c1f22d5e934eb2a760a89b4

  //Session.set('room',Meteor._localStorage.getItem('room'));
  Session.set('username',Meteor._localStorage.getItem('username'));
  Session.set('userid',Meteor._localStorage.getItem('userid'));

<<<<<<< HEAD
  Deps.autorun(function(){
    console.log('roomid ' + Session.get('roomid'));
    console.log('userid ' + Session.get('userid'));
    console.log('username ' + Session.get('username'));
  });

=======
  Session.set('currentMessageId',0);
  
  var currentMessageText='', //current message currentMessageText
    currentMessageTimestamp=0, //current timestamp
    mSub, //Message subscription
    ouSub; //OnlineUsers subscription
>>>>>>> 8a180cf8c2f292504c1f22d5e934eb2a760a89b4





  /*
    ACCOUNT MANAGEMENT
    for users logged in with Twitter,Github and shit
  */
  Deps.autorun(function () {
    if (Meteor.userId()) {
      // on login
      Meteor._localStorage.setItem('username',Meteor.user().profile.name);
      Meteor._localStorage.setItem('userid',Meteor.user()._id);
      Session.set('username',Meteor.user().profile.name);
      Session.set('userid',Meteor.user()._id);
    }
  });


<<<<<<< HEAD
  
  /*
    SET UP BASIC ROUTING
  */
  Meteor.Router.add({'/about':'about'});
  /*
  there aren't no 404's
    except the user types an invalid URL, then he will be redirected to /
  */
  Meteor.Router.add({'/*':'messagesList'});

  var pathRoot = window.location.pathname,
      room = pathRoot.substring(1); //path must be trimmed (no slash at beginning)
  console.log('current loc ' +pathRoot);

  if(isValidRoom(room)) {
    routeToRoom(room);
    subscribeToRoom(room);
  } else {
    if(Session.get('roomid')){
      routeToRoom(Session.get('roomid'));
      subscribeToRoom(Session.get('roomid'));
    }
  }



  function goOnline(){
    //register as online only if not already online
    if(!Session.get('userid') || !Session.get('username') || !Session.get('roomid'))
      return;
    if(OnlineUsers.find({userid:Session.get('userid'),username:Session.get('username'),roomid:Session.get('roomid')}).fetch().length === 0){  
      console.log('register online status');
      OnlineUsers.insert(
        {
          userid:Session.get('userid'),
          username:Session.get('username'),
          roomid:Session.get('roomid')
        }
      );
    }
  }
=======

  /**
    Online users
    OnlineUsers Collection:
      userid
      username
      room
  */
  Deps.autorun(function(){    
    if(Session.get('room') && Session.get('username') && Session.get('userid')) {
      if(OnlineUsers.find({userid:Session.get('userid'),username:Session.get('username'),room:Session.get('room')}).fetch().length === 0){
        console.log('register online status');
        OnlineUsers.insert(
          {
            userid:Session.get('userid'),
            username:Session.get('username'),
            room:Session.get('room')
          }
        );
>>>>>>> 8a180cf8c2f292504c1f22d5e934eb2a760a89b4

  Deps.autorun(function(){
    goOnline(); 
  });
  

  /*
    going offline, NOT LOGGIN OUT
  */
  window.onbeforeunload = goOffline;

<<<<<<< HEAD



=======
  function goOffline(){
    if(Session.get('userid') && Session.get('room')){
      Meteor.call('removeOnlineUserFromRoom',Session.get('userid'),Session.get('room'));
      var str = 'user ' + Session.get('username') + ' ('+Session.get('userid')+') leaves room  ' + Session.get('room');
      Meteor.call('clog',str);
      

      //redirect user to /
      Meteor.Router.to('/');
    }
  }
>>>>>>> 8a180cf8c2f292504c1f22d5e934eb2a760a89b4

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

  Template.messagesList.users =function(){
    return distinctUsers();
  }
  Template.messagesList.usersCount =function(){
    return distinctUsers().length;
  }











  
  /*
    SET UP ROUTING
  */
  Meteor.Router.add({'/about':'about'});
  Meteor.Router.add({'/*':'messagesList'});

  var pathRoot = window.location.pathname;

  if(!pathRoot.length && Session.get('room'))
    routeAndSubscribe(Session.get('room'));
  else
    routeAndSubscribe(pathRoot);


  function routeAndSubscribe(p){
    goOffline();
    var path;
    if(p.charAt(0) === '/')
      path = p.substring(1);
    else
      path = p;
    if(path.length){
      /*
        The path must be valid
          ==> no # and /
      */
      if(path.match(/^[a-z0-9]+$/i)){
        console.log('Routing to ' + p);
        //if(Session.get('username'))
          subscribeToRoom(path);
      } else {
        Meteor.Router.to('/');
      }
    }
  }
  


 
  




  Template.pickNickname.events({
    'keyup #nickname': function(evnt,tmplt){
      if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
        var nickname = tmplt.find('#nickname').value;
        if(nickname.length && nickname.indexOf(' ') <= 0) {
          //TODO: better unique ID
          userid = '' + Date.now();
          //bind it to the Session to make it reactive

          Meteor._localStorage.setItem('username',nickname);
          Meteor._localStorage.setItem('userid',userid);
          Session.set('username',nickname);
          Session.set('userid',userid);
        
          routeAndSubscribe(pathRoot);
        } else{
          //notify
        }
      }
    }
  });


  Template.logout.events({
    'click #logout' : function(evnt,tmplt){
      evnt.preventDefault();
      goOffline();
      if(Meteor.user())
        Meteor.logout();
      Meteor._localStorage.removeItem('username');
      Meteor._localStorage.removeItem('userid');
      Meteor._localStorage.removeItem('room');

      Session.set('username',null);
      Session.set('userid',null);
      Session.set('room',null);

      /*
        test if defined, since it is possible that the user logged in, but didn't select a room
      */
      if(mSub)
        mSub.stop();
    }
  });







<<<<<<< HEAD

=======
  /*
    Subscribes the user to a room
      -sets the Session var 'room'
      -registers a subscription to 'MessagesChatRoom' in mSub
      -routes to r
  */
  function subscribeToRoom(r){
    /*
      go offline in previous room, if any
    */
    goOffline();

    if(r.length){
      goOffline();
      Meteor._localStorage.setItem('room',r);
      Session.set('room',r);
    }else{
      Session.set('room',null);
      Meteor._localStorage.removeItem('room');
      unsubscribe();
    }
  }
>>>>>>> 8a180cf8c2f292504c1f22d5e934eb2a760a89b4




  function subscribe(){
    mSub=Meteor.subscribe('MessagesChatroom',Session.get('room'));
    ouSub = Meteor.subscribe('usersOnlineInThisRoom',Session.get('room'));
  }
  function unsubscribe(){
    if(mSub)
        mSub.stop();
    if(ouSub)
      ouSub.stop();
  }

  Template.selectChatRoom.events({
    'keyup #room': function(evnt,tmplt){
      if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
        var room = tmplt.find('#room').value;
        routeAndSubscribe(room);
      }
    }
  });



  
  /*
    global username, either from accounts or nickname
  */
  Template.roomSelected.username = function(){
    return Session.get('username');
  };

  Template.messagesList.loggedIn=Template.roomSelected.loggedIn=function(){
    if(Session.get('username') && Session.get('room'))
      return true;
    return false;
  };
  Template.messagesList.loggedInWithAccount=Template.login.loggedInWithAccount = function(){
    if(Meteor.user())
      return true;
    return false;
  }
  Template.messagesList.loggedInWithNickname=Template.login.loggedInWithNickname = function(){
    if(!Meteor.user() && Session.get('username'))
      return true;
    return false;
  }

  function iAmWriting(){
    if(Session.get('currentMessageId')){
      /*var m,p=0,
      ml = Messages.find().fetch().length,
      lm = Messages.find().fetch()[ml-1],
      lmid;
      if(lm)
        lmid = lm._id;
      //console.log(lmid);
      if(m=Messages.find({_id:lmid,userid:Session.get('userid')}).fetch()[0])
        if(m.userid === Session.get('userid')){
          return true;
        }*/
      return true;
    }
    return false;    
  }

  Template.messagesList.messages = function(){
    var ml = Messages.find({'room':Session.get('room')}).fetch().length;

    if(iAmWriting()){
      if(ml <= 1)
        return [];
      return Messages.find(
        {'room':Session.get('room')}
        ,{sort: {timestamp: 1},limit:ml -1});
    }else
      return Messages.find(
        {'room':Session.get('room')}
        ,{sort: {timestamp: 1}}
      );  
  };

  Template.messagesList.roomSelected=Template.login.roomSelected=Template.selectChatRoom.roomSelected= function(){
    if(Session.get('room'))
      return true;
    return false;
  };

  Template.selectChatRoom.selectedRoom= function(){
    if(Session.get('room'))
      return Session.get('room');
    return '';
  };


  Template.messagesList.events({
    'keyup #mymessage' : function(evnt,tmplt){
      currentMessageText = tmplt.find('#mymessage').value;
      currentMessageTimestamp = Date.now();

      /*First message/first keystroke being sent*/
      if(!Session.get('currentMessageId') && currentMessageText.length){
        console.log('first message');
        Session.set('currentMessageId',
          Messages.insert(
            {userid:Session.get('userid')
            ,user:Session.get('username')
            ,room:Session.get('room')
            ,text:currentMessageText
            ,timestamp:currentMessageTimestamp}
          )
        );
        return;
      }

      if(evnt.keyCode === 13){
        console.log('enter');
        if(currentMessageText.length){
          console.log('new message');
          //new Message
          Session.set('currentMessageId',0);
          tmplt.find('#mymessage').value = '';
        } else {
          console.log('deleting message');
          /*
            remove the last message, since it's shit
          */
          Messages.remove({_id:''+Session.get('currentMessageId')});
          Session.set('currentMessageId',0)
        }
      } else {
        if(currentMessageText.length){
          console.log('updating message');
          Messages.update(
            {_id:''+Session.get('currentMessageId')}
            ,{$set : {
                text:currentMessageText
                ,timestamp:currentMessageTimestamp
              }
            }
          );
        } else {
          Messages.remove({_id:''+Session.get('currentMessageId')});
          Session.set('currentMessageId',0)
        }
      }
      $('#mymessage').focus();
    },

    'click #deleteMyMessages' : function(evnt,tmplt){
      evnt.preventDefault();
      if(confirm('Do you want to remove your messages from this room?')){
        Meteor.call('removeMessagesOfUserInRoom',Session.get('userid'));
      }
    },

  });
  


  $(document).ready(function() {

    function adapt(){

      $('.messages').innerWidth( Math.floor($('.main').innerWidth() -1 - $('#online-users').innerWidth()) );
    
    }


    $(window).resize(function(){
      adapt();
    });

    adapt();

  });
}

if (Meteor.isServer) {


  Messages.allow({
    insert : function(){return true}
    ,update : function(){return true}
    ,remove : function(){return true}
  });
  OnlineUsers.allow({
    insert : function(){return true}
    ,update : function(){return true}
    ,remove : function(){return true}
  });  

  Meteor.publish('MessagesChatroom',function(room){
    return Messages.find(
      {
        room:room
      }
    );
  });

  Meteor.publish('usersOnlineInThisRoom',function(room){
    return OnlineUsers.find(
      {
        room:room
      }
    );
  });


  Meteor.methods({
    removeMessagesOfUserInRoom : function(userid){
      Messages.remove({userid:userid}, function(){console.log('messages removed');});
      Messages.remove({userid:''+userid}, function(){console.log('messages removed');});
    },
    clog : function(s){
      console.log(s);
    },
    removeOnlineUserFromRoom : function(userid,room){
      OnlineUsers.remove({userid:userid,room:room});
      console.log('removed messages of user ' + userid + ' from room ' + room);
    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
