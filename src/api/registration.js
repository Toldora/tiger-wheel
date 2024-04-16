import { turboApi } from './instance';

const getRegistrationFields = async () => {
  const response = await turboApi.get('/api/player/fields/validations', {
    params: { scenario: 'registration' },
  });
  return response.data;
};

const registerUser = async registrationFormData => {
  const response = await turboApi.post(
    '/api/player/register',
    registrationFormData,
  );
  return response.data;
};

const registerUserViaTelephone = async registrationFormData => {
  const response = await turboApi.post(
    '/api/player/register/phone',
    registrationFormData,
  );
  return response.data;
};

const getUserGeo = async () => {
  const response = await turboApi.get('/api/player/init');
  return response.data;
};

const getCountries = async () => {
  const response = await turboApi.get('/api/settings/countries');
  return response.data;
};

const getCurrencies = async () => {
  const response = await turboApi.get('/api/settings/currencies');
  return response.data;
};

const getLocales = async () => {
  const response = await turboApi.get('/api/settings/locales');
  return response.data;
};

export {
  getRegistrationFields,
  registerUser,
  registerUserViaTelephone,
  getUserGeo,
  getCountries,
  getCurrencies,
  getLocales,
};
