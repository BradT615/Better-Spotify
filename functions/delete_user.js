const supabase = require('../utils/supabaseClient.js');
const cookie = require('cookie');

exports.handler = async (event, context) => {
    // Parse the session_id from the cookies in the incoming request
    let cookies = cookie.parse(event.headers.cookie || '');
    let session_id = cookies.session_id;

    // Delete the user's data from the database
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', session_id);

    if (error) {
      console.error('Failed to delete user:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal Server Error: Failed to delete user.' })
      };
    }

    return {
        statusCode: 200,
        headers: {
            'Set-Cookie': `session_id=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Secure; HttpOnly; SameSite=None; Path=/`
        },
        body: JSON.stringify({ message: 'User data deleted successfully.' })
    };
};
