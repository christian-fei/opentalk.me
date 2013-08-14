var Messages = new Meteor.Collection('Messages');
var OnlineUsers = new Meteor.Collection('OnlineUsers');
Messages.allow({
  insert : function(userId,doc){
    //console.log(userId + ' attempts to insert a doc');
    //console.log('on the server he is ' + this.userId + ' || ' + Meteor.userId());
    return true}
  ,update : function(userId,doc){return true}
  ,remove : function(userId,doc){return true}
});

/*Meteor.users.deny({
  update: function () { return true; }
});*/
Meteor.publish('MessagesChatroom',function(roomid){
  return Messages.find(
    {
      roomid:roomid
    },{sort:{timestamp:1}}
  );
});

Meteor.publish('usersOnlineInThisRoom',function(roomid){
  return OnlineUsers.find(
    {
      roomid:roomid
    }
  );
});
Meteor.publish("userData", function () {
  return Meteor.users.find({_id: this.userId},{});
});


var idleTime = 20*1000,
    idleCheck = idleTime/2,
    killTime = 20*60*1000,
    killCheck = killTime/2;

Meteor.methods({
  serverTime : function(){
    //console.log('requested serverTime');
    return Date.now();
  },
  removeMessagesOfUserInRoom : function(userid,roomid){
    Messages.remove({userid:userid,roomid:roomid}, function(){console.log('messages of user ' + userid + ' removed from room ' + roomid);});
  },
  clog : function(s){
    console.log(s);
  },
  setUserStatus: function(userid,username,roomid,status){
    //console.log('t.uid ' + this.userId);
    //console.log('m.u()' + Meteor.userId());
    if(!userid || !roomid)
      return;
    if(status === 'offline'){
      OnlineUsers.remove({userid:userid});
      console.log('offline ' + userid);
      /*mark all messages as complete*/
      Messages.update(
        {userid:userid,roomid:roomid}
        ,{$set : {messageComplete:true}}
        ,{multi:true}
      );
      return;
    }
    var now = Date.now();
    if( OnlineUsers.find( {userid:userid,nickname:username,roomid:roomid} ).fetch().length === 0 ){
     
      OnlineUsers.insert(
        {
          userid:userid,
          nickname:username,
          roomid:roomid,
          status:status,
          lastSeen:now
        }
      );
      console.log('setOnlineUser: registering as online [' + username + '](' + userid + ') @ ' + roomid  + ' with status ' + status);
    }else{
      //keep alive
      OnlineUsers.update({userid:userid,roomid:roomid},{$set:{status:'online',lastSeen:now}});
      console.log('keep alive ' + userid + ' in  ' + roomid);
    }
  },

  setUserId: function(userId) {
    //console.log('previous userId ' + this.userid);
    this.setUserId(userId)
    //console.log('setting user id ' + this.userId);
  }
});

Meteor.setInterval(function() {
  //console.log('idle check');
  var now = Date.now();
  OnlineUsers.find( {lastSeen: {$lt: (now - idleTime)} } ).forEach(function(user){
    OnlineUsers.update({_id:user._id,roomid:user.roomid},{$set:{status:'idle'}});
  });
},idleCheck);

Meteor.setInterval(function() {
  //console.log('kill check');
  var now = Date.now();
  OnlineUsers.find( {lastSeen: {$lt: (now - killTime)} } ).forEach(function(user){
    OnlineUsers.remove({_id:user._id,roomid:user.roomid},{multi:true});
  });
},killCheck);


Meteor.startup(function () {
  // code to run on server at startup
});

function cleanUpObsoleteOnlineUsers(){
  
}