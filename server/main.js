Messages.allow({
  //on the client the message length limit is 500, but since I add tags and shit it gets bigger, hopefully not more than 1000 chars..
  insert  : function(userId,doc){
    // console.log(userId);
    // console.log(Meteor.userId());
    // console.log(doc);
    if(userId && userId === Meteor.userId() && doc.text.length < 1000 && !doc.text.match(/<[^>]*script/gmi) && doc.messageComplete !== undefined && doc.roomid && doc.useravatar && doc.userid && doc.username)
      return true;
    return false;}
  ,update : function(userId,doc){
    if(userId && userId === Meteor.userId() && doc.text.length < 1000 && !doc.text.match(/<[^>]*script/gmi) && doc.messageComplete !== undefined && doc.roomid && doc.useravatar && doc.userid && doc.username)
      return true;
    return false;}
  ,remove : function(userId,doc){if(userId && userId === Meteor.userId())return true; return false;}
});

Rooms.allow({
  insert  : function(userId,doc){
    if(userId && userId === Meteor.userId() && doc.tags.length  <= 5){ for(var i=0;i<doc.tags.length;i++){if(doc.tags[i].match(/<[^>]*script/gmi))return false;}return true;} return false;
  }
  ,update : function(userId,doc){
    if(userId && userId === Meteor.userId() && doc.tags.length  <= 5){ for(var i=0;i<doc.tags.length;i++){if(doc.tags[i].match(/<[^>]*script/gmi))return false;}return true;} return false;}
  // ,remove : function(userId,doc){return false; if(userId && userId === Meteor.userId())return true;return false;}
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

Meteor.publish('userLastSeenInRooms', function(roomid) {
  return LastSeenInRoom.find({userid:this.userId,roomid:roomid}, {sort: {timestamp:-1}});
});



var idleTime = 20*1000,
    idleCheck = idleTime/2,
    killTime = 20*60*1000,
    killCheck = killTime/2;

Meteor.methods({

  globalMessagesCount: function(){
    return Messages.find().count();
  },
  globalRoomsCount: function(){
    return Rooms.find().count();
  },
  globalOnlineUsersCount: function(){
    return OnlineUsers.find().count();
  },
  globalRegisteredUsersCount: function(){
    return Meteor.users.find().count();
  },
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
  removeMessagesOfUserInRoom : function(roomid){
    if(Meteor.userId())
      Messages.update(
        {userid:Meteor.userId(),roomid:roomid},
        {$set:
          {deletedAt:Date.now()}
        },
        {multi:true}
      );
      // Messages.remove({userid:userid,roomid:roomid}, function(){console.log('messages of user ' + userid + ' removed from room ' + roomid);});
  },
  removeMessagesOfUser : function(){
    if(Meteor.userId())
      Messages.update(
        {userid:Meteor.userId()},
        {$set:{
          deletedAt:Date.now()}
        },
        {multi:true}
      );
      // Messages.remove({userid:Meteor.userId()}, function(){console.log('messages of user removed ' + userid);});
  },
  clog : function(s){
    console.log(s);
  },
  setUserStatus: function(userid,username,roomid,avatar,status){
    //console.log('t.uid ' + this.userId);
    //console.log('m.u()' + Meteor.userId());
    if(!userid || !roomid || !username)
      return;
    if(status === 'offline'){
      OnlineUsers.remove({userid:userid,roomid:roomid});
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
          lastSeen:now,
          avatar:avatar
        }
      );
      // console.log('setOnlineUser: registering as online [' + username + '](' + userid + ') @ ' + roomid  + ' with status ' + status);
    }else{
      //keep alive
      OnlineUsers.update({userid:userid,roomid:roomid},{$set:{status:'online',lastSeen:now,avatar:avatar}});
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
    return Rooms.find({tags: {$in: [regex] }},{limit: 10}).fetch();
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