import { customerIOApi } from './instance';

const sendTransactionalEmail = async emailData => {
  const response = await customerIOApi.post('/v1/send/email', emailData);
  return response.data;
};

export { sendTransactionalEmail };
