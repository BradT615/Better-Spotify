import supabase from '../utils/supabaseClient.js'

exports.handler = async (event, context) => {
    // Insert some test data into the 'users' table
    const testData = [
        { id: 'test1', access_token: 'token1', refresh_token: 'refresh1' },
        { id: 'test2', access_token: 'token2', refresh_token: 'refresh2' },
        { id: 'test3', access_token: 'token3', refresh_token: 'refresh3' },
    ];
    const { error: insertError } = await supabase
        .from('users')
        .insert(testData);

    if (insertError) {
        console.log('Error inserting data: ', insertError);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to insert data' }),
        };
    }

    // Fetch all data from the 'users' table
    const { data, error: selectError } = await supabase
        .from('users')
        .select('*')

    if (selectError) {
        console.log('Error fetching data: ', selectError);
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