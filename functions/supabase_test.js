import supabase from '../utils/supabaseClient.js'

exports.handler = async (event, context) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
  
    if (error) {
      console.log('Error fetching data: ', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch data' }),
      };
    } else {
      console.log('Data fetched successfully: ', data);
      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    }
};