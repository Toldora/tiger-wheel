import { wavixApi } from './instance';

const sendMessage = async messageFormData => {
  const response = await wavixApi.post(
    `/v2/messages?appid=${import.meta.env.VITE_WAVIX_API_KEY}`,
    messageFormData,
  );
  return response.data;
};

const validatePhone = async phone => {
  const response = await wavixApi.get(
    `/v1/validation?appid=${
      import.meta.env.VITE_WAVIX_API_KEY
    }&type=validation&phone_number=${phone}`,
  );
  return response.data;
};

export { sendMessage, validatePhone };
