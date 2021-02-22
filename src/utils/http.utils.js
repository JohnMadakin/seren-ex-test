const axios = require('axios').default;

module.exports = {
  request(method, { url, data = {}, headers = {} }) {
    return axios({
      method,
      headers,
      url,
      data,
      timeout: 60000,
    });
  },

  get({ url, headers = {} }) {
    return this.request('get', { url, headers });
  },

  post({ url, data = {}, headers = {} }) {
    return this.request('post', { url, data, headers });
  },
};
