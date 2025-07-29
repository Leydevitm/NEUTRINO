const axios = require('axios');

const sendCodeWithNeutrino = async (phoneNumber, message='') => {
  const apiUrl = 'https://neutrinoapi.net/sms-verify';
  const userId = process.env.NEUTRINO_USER_ID;
  const apiKey = process.env.NEUTRINO_API_KEY;
  const codeLength = process.env.CODE_LENGTH || 6;
  const brandName = process.env.BRAND_NAME || 'Super Kompras';

  const data = new URLSearchParams();
  data.append('user-id', userId);
  data.append('api-key', apiKey);
  data.append('number', phoneNumber);
  data.append('code-length', codeLength);
  data.append('brand-name',brandName);
  data.append('security-code', '');

    if (message) data.append('message', message);  

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  try {
    const response = await axios.post(apiUrl, data.toString(), { headers });
    return response.data;
  } catch (error) {
    console.error('Error al conectar con Neutrino:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = { sendCodeWithNeutrino };
