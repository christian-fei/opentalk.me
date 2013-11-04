var idleTime = 20*1000,
    idleCheck = idleTime/2,
    killTime = 20*60*1000,
    killCheck = killTime/2;

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


var fs = Npm.require('fs'),
    path = Npm.require('path');
var __dirname = path.resolve('../../../');
/*
../../../ for demeteorized package
../../../../../ when running through meteor
*/

Meteor.Router.add( '/manifest.webapp', 'GET', function () {
  console.log('wants manifest ' + __dirname);
  return [200,
    {
       'Content-type': 'application/x-web-app-manifest+json'
    }, fs.readFileSync( __dirname + '/manifest.webapp' )];
} );