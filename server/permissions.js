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

Meteor.users.deny({
  'insert':function(){return false;},
  'update':function(){return false;},
  'remove':function(){return false;}
});