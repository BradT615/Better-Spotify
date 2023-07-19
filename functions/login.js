const querystring = require('querystring');

let generateRandomString = function(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

exports.handler = async (event, context) => {
  let state = generateRandomString(16);
  // Set the cookie in client-side

  // your application requests authorization
  let scope = 'user-read-private user-read-email';
  let redirectUri = 'http://localhost:8888/callback'; // Update this to your Netlify site URL
  let url = 'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.CLIENT_ID,
      scope: scope,
      redirect_uri: redirectUri,
      state: state
    });

  return {
    statusCode: 302,
    headers: {
      Location: url,
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({})
  };
};