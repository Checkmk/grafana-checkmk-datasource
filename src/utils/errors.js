const requiredVersion = '1.5.0p16';

const error = (message) => ({
    status: 'error',
    title: 'Error',
    message
});

export default {
    CANCEL: error(`API request was cancelled. This has either happened because no 'Access-Control-Allow-Origin' header is present, or because of a ssl protocol error. Make sure you are running at least Checkmk version ${requiredVersion}.`),
    READ: error('Could not read API response, make sure the URL you provided is correct.'),
    FORMAT: error('Invalid URL format. Please make sure to include protocol and trailing slash. Example: https://checkmk.server/site/'),
    STATUS: error('Could not connect to provided URL'),
    OTHER: error
};