import axios from 'axios';
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:8080'; // Korrigiert von baseUrl zu baseURL
axios.defaults.headers.post["Content-Type"] = 'application/json';

export const request = (method, url, data) => {
    return axios({
        method: method,
        url: url,
        data: data
    });
};
