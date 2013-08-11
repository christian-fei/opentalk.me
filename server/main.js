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


var idleTime = 5*60*1000,
    idleCheck = 1*60*1000,
    killTime = 60*60*1000,
    killCheck = 30*60*1000;


Meteor.methods({
  serverTime : function(){
    return Date.now();
  },
  removeMessagesOfUserInRoom : function(userid,roomid){
    Messages.remove({userid:userid,roomid:roomid}, function(){console.log('messages of user ' + userid + ' removed from room ' + roomid);});
  },
  clog : function(s){
    console.log(s);
  },
  setUserStatus: function(userid,username,roomid,status){
    if(!userid || !roomid)
      return;
    if(status === 'offline'){
      OnlineUsers.remove({userid:userid,roomid:roomid});
      console.log('offline ' + userid);
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
      OnlineUsers.update({userid:userid},{$set:{status:'online',lastSeen:now}});
      console.log('keep alive ' + userid);

      //console.log('setOnlineUser: already online [' + username + '](' + userid + ') @ ' + roomid );
    }
  }
});

Meteor.setInterval(function() {
  var now = Date.now();
  OnlineUsers.find( {lastSeen: {$lt: (now - idleTime)} } ).forEach(function(user){
    OnlineUsers.update({_id:user._id},{$set:{status:'idle'}});
  });
},idleCheck);

Meteor.setInterval(function() {
  var now = Date.now();
  OnlineUsers.find( {lastSeen: {$lt: (now - killTime)} } ).forEach(function(user){
    OnlineUsers.remove({_id:user._id});
  });
},killCheck);


Meteor.startup(function () {
  // code to run on server at startup
});

function cleanUpObsoleteOnlineUsers(){
  
}