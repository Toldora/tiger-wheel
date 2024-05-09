import { mailscanApi } from './instance';

const validateEmail = async email => {
  const response = await mailscanApi.get(
    `/verify?email=${email}&api_key=${import.meta.env.VITE_MAILSCAN_API_KEY}`,
  );
  return response.data;
};

export { validateEmail };
