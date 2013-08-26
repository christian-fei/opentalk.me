Messages.allow({
  insert  : function(userId,doc){if(userId === Meteor.userId())return true; return false;}
  ,update : function(userId,doc){if(userId === Meteor.userId())return true; return false;}
  ,remove : function(userId,doc){if(userId === Meteor.userId())return true; return false;}
});

//users can't do shit
Rooms.allow({
  insert  : function(userId,doc){
    /*rooms can't contain more than 5 tags*/
    //TODO
    console.log(userId === Meteor.userId());
    if(userId === Meteor.userId())return true; return false;
  }
  ,update : function(userId,doc){if(userId === Meteor.userId())return true; return false;}
  ,remove : function(userId,doc){if(userId === Meteor.userId())return true; return false;}
});

// console.log(process.env);
Meteor.publish('paginatedMessages', function(roomid,limit) {
  return Messages.find({roomid:roomid}, {sort: {timestamp:-1}, limit: limit});
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
Meteor.publish('roomTags',function(roomid){
  //if there is no such room, create one
  if( Rooms.find({roomid:roomid}).count() === 0  && roomid !== null)
    Rooms.insert({roomid:roomid,tags:[]});
  return Rooms.find({roomid:roomid});
});

var idleTime = 20*1000,
    idleCheck = idleTime/2,
    killTime = 20*60*1000,
    killCheck = killTime/2;

Meteor.methods({
  calltest:function(arg1){
    console.log(arg1);
    return arg1;
  },
  messagesCount:function(roomid){
    return Messages.find({roomid:roomid}).count();
  },
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
    if(!userid || !roomid || !username)
      return;
    if(status === 'offline'){
      OnlineUsers.remove({userid:userid});
      // console.log('offline ' + userid);
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
      // console.log('setOnlineUser: registering as online [' + username + '](' + userid + ') @ ' + roomid  + ' with status ' + status);
    }else{
      //keep alive
      OnlineUsers.update({userid:userid,roomid:roomid},{$set:{status:'online',lastSeen:now}});
      // console.log('keep alive ' + userid + ' in  ' + roomid);
    }
  },
  //not used anymore
  setUserId: function(userId) {
    this.setUserId(userId)
  },
  getUserStats:function(){
    var ret={};
    ret.messagesCount = Messages.find({userid:Meteor.userId()},{fields:{roomid:true,text:true}}).count();
    var roomsCount=charactersCount=wordsCount=0;
    var mu=Messages.find({userid:Meteor.userId()},{sort:{roomid:-1}}).fetch(),
        i=0,roomsOcc=[];
    while(m=mu[i++]){
      if(roomsOcc.indexOf(m.roomid) === -1){
        roomsCount++;
        roomsOcc.push(m.roomid);
      }
      charactersCount+=m.text.length;
      wordsCount+=m.text.trim().replace(/\s+/gi, ' ').split(' ').length;
    }
    ret.rooms=roomsOcc;
    ret.roomsCount=roomsCount;
    ret.charactersCount=charactersCount;
    ret.wordsCount=wordsCount;
    return ret;
  },
  roomsTaggedWith:function(tag){
    if(!tag)return [];
    var regex = new RegExp(tag, "gi");
    return Rooms.find({tags: {$in: [regex] }}).fetch();
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