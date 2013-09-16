// Social stuff
// inspired by: https://github.com/wiljanslofstra/Jet-Chat/blob/master/server/services.js

// first, remove configuration entry in case service is already configured
var services = ['facebook','twitter'];

var i = 0;
for(i; i < services.length; i++) {
  Accounts.loginServiceConfiguration.remove({
    service: services[i]
  });
}

/**
 *  Create Facebook configuration
 */
Accounts.loginServiceConfiguration.insert({
  service: "facebook",
  appId: "123456789012345",
  secret: "12345678901234512345678901234512"
});

/**
 *  Create Twitter configuration
 */
Accounts.loginServiceConfiguration.insert({
  service: "twitter",
  consumerKey: "123456789012345",
  secret: "12345678901234512345678901234512"
});

/**
 *  Create Google configuration
 */
// Accounts.loginServiceConfiguration.insert({
//   service: "google",
//   clientId: "1234567890",
//   secret: "12345678901234512345678901234512"
// });