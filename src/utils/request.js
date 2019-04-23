const buildUrlWithParams = (url, params) => url + Object.keys(params)
    .reduce((string, param) => `${string}${string ? '&' : '?'}${param}=${params[param]}`, '');

const buildRequestBody = (data) => `request=${JSON.stringify(data)}`;

const getResult = (response) => response.data.result;

export default {
    buildUrlWithParams,
    buildRequestBody,
    getResult,
};
