Messages = new Meteor.Collection('Messages');
OnlineUsers = new Meteor.Collection('OnlineUsers');

if(Meteor.isClient) {
  /*
    set absoluteUrl for setting up the accounts system for the right domain
  */
  console.log(Meteor.absoluteUrl({rootUrl:'http://opentalk.me'}));










  /*
  restoring the previous session
  I'm attaching the values of localStorage to the session,
    to enable the reactivity sources (like Session) of Meteor
  */


  //Session.set('room',Meteor._localStorage.getItem('room'));
  Session.set('username',Meteor._localStorage.getItem('username'));
  Session.set('userid',Meteor._localStorage.getItem('userid'));

  Session.set('currentMessageId',0);
  
  var currentMessageText='', //current message currentMessageText
    currentMessageTimestamp=0, //current timestamp
    mSub, //Message subscription
    ouSub; //OnlineUsers subscription





  /*
    ACCOUNT MANAGEMENT
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



  /*
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

      } 
    } 
  });


  /*
    going offline, NOT LOGGIN OUT
  */
  window.onbeforeunload = goOffline;

  function goOffline(){
    if(Session.get('userid') && Session.get('room')){
      Meteor.call('removeOnlineUserFromRoom',Session.get('userid'),Session.get('room'));
      var str = 'user ' + Session.get('username') + ' ('+Session.get('userid')+') leaves room  ' + Session.get('room');
      Meteor.call('clog',str);
      

      //redirect user to /
      Meteor.Router.to('/');
    }
  }

  function distinctUsers(){
    var users = OnlineUsers.find().fetch();
    var distinctUsers = _.uniq(users, false, function(d) {return [d.username,d.userid]});
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
          userid = Date.now();
          //bind it to the Session to make it reactive

          Meteor._localStorage.setItem('username',nickname);
          Meteor._localStorage.setItem('userid',userid);
          Session.set('username',Meteor._localStorage.getItem('username'));
          Session.set('userid',Meteor._localStorage.getItem('userid'));
        
          routeAndSubscribe(pathRoot);
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
