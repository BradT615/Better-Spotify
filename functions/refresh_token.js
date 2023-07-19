const request = require('request');

exports.handler = async (event, context) => {
  let refresh_token = event.queryStringParameters.refresh_token;

  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64'))
    },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  return new Promise((resolve, reject) => {
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        let access_token = body.access_token;

        resolve({
          statusCode: 200,
          body: JSON.stringify({
            'access_token': access_token
          })
        });
      } else {
        reject({
          statusCode: 500,
          body: JSON.stringify({ message: 'Internal Server Error: Failed to refresh access token.' })
        });
      }
    });
  });
};