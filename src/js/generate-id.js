const CHARS = '0123456789';
const ID_LENGTH = 10;

export const generateId = () => {
  let password = '';

  for (let i = 0; i < ID_LENGTH; i += 1) {
    const randomNumber = Math.floor(Math.random() * CHARS.length);
    password += CHARS.substring(randomNumber, randomNumber + 1);
  }

  return password;
};
