Messages = new Meteor.Collection('Messages');
OnlineUsers = new Meteor.Collection('OnlineUsers');

if(Meteor.isClient) {
  /*
  set absoluteUrl for setting up the accounts system for the right domain
  */
  console.log(Meteor.absoluteUrl({rootUrl:'http://opentalk.me'}));

  /*
    RESET
  */
  Session.set('lastInsertId',null);

  if(Meteor._localStorage.getItem('roomid'))
    Session.set('roomid',Meteor._localStorage.getItem('roomid'));

  Session.set('username',Meteor._localStorage.getItem('username'));
  Session.set('userid',Meteor._localStorage.getItem('userid'));

  console.log('roomid ' + Session.get('roomid'));
  console.log('userid ' + Session.get('userid'));
  console.log('username ' + Session.get('username'));

  var lastInsertId=0, //ID of the last inserted message
  text='', //current message text
  t=0, //current timestamp
  mSub, //Message subscription
  ouSub, //OnlineUsers subscription
  rSub=null; //Room subscription





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
    SET UP ROUTING
  */
  Meteor.Router.add({'/about':'about'});
  Meteor.Router.add({'/*':'messagesList'});
  
  var pathRoot = window.location.pathname;
      

  console.log(pathRoot);
  routeAndSubscribe(pathRoot);


  function routeAndSubscribe(p){
    path = p.substring(1);
     if(path !== '/'){
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
  


 
  /*
    Online users

    OnlineUsers Collection:
      userid
      username
      roomid
  */
  Deps.autorun(function(){ 
    if(Session.get('roomid'))
      ouSub = Meteor.subscribe('usersOnlineInThisRoom',Session.get('roomid'));
    else
      if(ouSub)
        ouSub.stop();
    
    if(Session.get('roomid') && Session.get('username') && Session.get('userid')) {
    
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
  });


  /*
    going offline
  */
  window.onbeforeunload = goOffline;

  function goOffline(){
    Meteor.call('removeOnlineUserFromRoom',Session.get('userid'),Session.get('roomid'));
    Meteor.call('clog','logging out');
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
      Meteor._localStorage.removeItem('roomid');

      Session.set('username',null);
      Session.set('userid',null);
      Session.set('roomid',null);

      //redirect user to /
      Meteor.Router.to('/');
      /*
        test if defined, since it is possible that the user logged in, but didn't select a room
      */
      if(mSub)
        mSub.stop();
    }
  });







  /*
    Subscribes the user to a room
      -sets the Session var 'roomid'
      -registers a subscription to 'MessagesChatRoom' in mSub
      -routes to r
  */
  function subscribeToRoom(r){
    if(r.length){
      goOffline();
      Meteor._localStorage.setItem('roomid',r);
      Session.set('roomid',r);
      mSub=Meteor.subscribe('MessagesChatroom',Session.get('roomid'));
      Session.set('route','/'+r);
      Meteor.Router.to(Session.get('route'));
    }else{
      Meteor.Router.to('/');
      Meteor._localStorage.removeItem('roomid');
      Session.set('roomid',null);
     if(mSub)
        mSub.stop();
    }
  }

  Template.selectChatRoom.events({
    'keyup #roomid': function(evnt,tmplt){
      if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
        var room = tmplt.find('#roomid').value;
        subscribeToRoom(room);
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
    if(Session.get('username') && Session.get('roomid'))
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
    if(Session.get('lastInsertId')){
      var m,p=0,
      ml = Messages.find().fetch().length,
      lm = Messages.find().fetch()[ml-1],
      lmid;
      if(lm)
        lmid = lm._id;
      //console.log(lmid);
      if(m=Messages.find({_id:lmid,userid:Session.get('userid')}).fetch()[0])
        if(m.userid === Session.get('userid')){
          return true;
        }
      return false;
    }
    return false;    
  }

  Template.messagesList.messages = function(){
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
  Template.messagesList.roomSelected=Template.login.roomSelected=Template.selectChatRoom.roomSelected= function(){
    if(Session.get('roomid'))
      return true;
    return false;
  };

  Template.selectChatRoom.selectedRoom= function(){
    if(Session.get('roomid'))
      return Session.get('roomid');
    return '';
  };


  Template.messagesList.events({
    'keyup #mymessage' : function(evnt,tmplt){
      if(Session.get('username')){

        text = tmplt.find('#mymessage').value;
        t = Date.now();

        /*First message/first keystroke being sent*/
        if(!Session.get('lastInsertId') && text.length){
          Session.set(
            'lastInsertId',
            Messages.insert(
              {userid:Session.get('userid')
              ,user:Session.get('username')
              ,roomid:Session.get('roomid')
              ,text:text
              ,timestamp:t}
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
            Messages.remove({_id:''+Session.get('lastInsertId')});
            Session.set('lastInsertId',null);
          }
        } else {
          if(text.length){
            Messages.update(
              {_id:''+Session.get('lastInsertId')}
              ,{$set : {
                  text:text
                  ,timestamp:t
                }
              }
            );
          } else {
            Messages.remove({_id:''+Session.get('lastInsertId')});
            Session.set('lastInsertId',null);
          }
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

    adapt();

    $(window).resize(function(){
      adapt();
    });
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

  Meteor.publish('MessagesChatroom',function(roomid){
    return Messages.find(
      {
        roomid:roomid
      }
    );
  });

  Meteor.publish('usersOnlineInThisRoom',function(roomid){
    return OnlineUsers.find(
      {
        roomid:roomid
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
    removeOnlineUserFromRoom : function(userid,roomid){
      OnlineUsers.remove({userid:userid,roomid:roomid});
      console.log('removed messages of user ' + userid + ' from room ' + roomid);
    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
