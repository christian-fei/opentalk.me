Messages = new Meteor.Collection('Messages');
if(Meteor.isClient) {
  /*
    set absoluteUrl for setting up the accounts system for the right domain
  */
  console.log(Meteor.absoluteUrl({rootUrl:'http://opentalk.me'}));

  /*
    RESET
  */
  Session.set('lastInsertId',null);
  Session.set('roomID',null);


  var lastInsertId=0, //ID of the last inserted message
  text='', //current message text
  t=0, //current timestamp
  mSub, //Message subscription
  rSub=null; //Room subscription


  /*
  */

  Session.set('username',Meteor._localStorage.getItem('username'));
  Session.set('userid',Meteor._localStorage.getItem('userid'));
  
  /*
  console.log('sun  ' + Session.get('username'));
  console.log('sui  ' + Session.get('userid'));
  */
  /*
    SET UP ROUTING
  */
  Meteor.Router.add({'/about':'about'});
  Meteor.Router.add({'/*':'messagesList'});
  
  var pathRoot = window.location.pathname,
      path = pathRoot.substring(1);

  if(path !== '/'){
    /*
      The path must be valid
        ==> no # and /
    */
    if(path.match(/^[a-z0-9]+$/i)){
      console.log('Routing to ' + pathRoot);
      Meteor.Router.to(pathRoot);
      if(Session.get('username'))
        subscribeToRoom(window.location.pathname.substring(1));
    } else {
      Meteor.Router.to('/');
    }
  }


  /*
    ACCOUNT MANAGEMENT
  */
  Meteor.autorun(function () {
    if (Meteor.userId()) {
      // on login
      Meteor._localStorage.setItem('username',Meteor.user().profile.name);
      Meteor._localStorage.setItem('userid',Meteor.user()._id);
      Session.set('username',Meteor.user().profile.name);
      Session.set('userid',Meteor.user()._id);
    }
  });

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
        }
      }
    }
  });


  Template.logout.events({
    'click #logout' : function(evnt,tmplt){
      evnt.preventDefault();
      if(Meteor.user())
        Meteor.logout();
      Meteor._localStorage.removeItem('username');
      Meteor._localStorage.removeItem('userid');

      Session.set('username',null);
      Session.set('userid',null);
      Session.set('roomID',null);

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
      -sets the Session var 'roomID'
      -registers a subscription to 'MessagesChatRoom' in mSub
      -routes to r
  */
  function subscribeToRoom(r){
    if(r.length){
      Session.set('roomID',r);
      mSub=Meteor.subscribe('MessagesChatroom',Session.get('roomID'));
      Session.set('route','/'+r);
      Meteor.Router.to(Session.get('route'));
    }else{
      Meteor.Router.to('/');
      Session.set('roomID',null);
      if(mSub)
        mSub.stop();
    }
  }

  Template.selectChatRoom.events({
    'keyup #roomID': function(evnt,tmplt){
      if((evnt.type === 'click') || (evnt.type === 'keyup' && evnt.keyCode ===13)) {
        var room = tmplt.find('#roomID').value;
        subscribeToRoom(room);
      }
    }
  });



  
  /*
    global username, either from accounts or nickname
  */
  Template.messagesList.username=Template.login.username = function(){
    return Session.get('username');
  };

  Template.selectChatRoom.loggedIn=Template.login.loggedIn=function(){
    if(Session.get('username'))
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
    var ml = Messages.find({'roomID':Session.get('roomID')}).fetch().length;

    if(iAmWriting()){
      if(ml <= 1)
        return [];
      return Messages.find(
        {'roomID':Session.get('roomID')}
        ,{sort: {timestamp: 1},limit:ml -1});
    }else
      return Messages.find(
        {'roomID':Session.get('roomID')}
        ,{sort: {timestamp: 1}}
      );  
  };
  Template.messagesList.roomSelected=Template.selectChatRoom.roomSelected= function(){
    if(Session.get('roomID'))
      return true;
    return false;
  };

  Template.selectChatRoom.selectedRoom= function(){
    if(Session.get('roomID'))
      return Session.get('roomID');
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
              ,roomID:Session.get('roomID')
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
    },

    'click #deleteMyMessages' : function(evnt,tmplt){
      evnt.preventDefault();
      if(confirm('Do you want to remove your messages from this room?')){
        Meteor.call('removeMessagesOfUserInRoom',Session.get('userid'));
      }
    }
  });
  

}

if (Meteor.isServer) {


  Messages.allow({
    insert : function(){return true}
    ,update : function(){return true}
    ,remove : function(){return true}
  });

  Meteor.publish('MessagesChatroom',function(roomID){
    return Messages.find(
      {roomID:roomID}
    )
   }
  );

  Meteor.methods({
    removeMessagesOfUserInRoom : function(userid){
      Messages.remove({userid:userid}, function(){console.log('messages removed');});
    }
  });

  Meteor.startup(function () {
    // code to run on server at startup
  });
}
