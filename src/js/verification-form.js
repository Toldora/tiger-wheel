import handlebars from 'handlebars';
import queryString from 'query-string';
import {
  ERROR_MESSAGES_EN,
  ERROR_MESSAGES_PT,
  generateId,
  generatePassword,
  getFromLS,
  registerUserViaTelephone,
  sendSms,
  setToLS,
} from 'mayanbet-sdk';
import verificationFormTemplate from '@/partials/verification-form.hbs?raw';
import { globalState } from '@/js/global-state';
import { renderSignUpForm } from '@/js/sign-up-form';
import { runCountdown } from '@/js/countdown';

const modalContentRef = document.querySelector('.js-app-modal-content');
const onlyNumbersRegex = new RegExp('\\d');
const OTP_DELAY_SECONDS = 60;

export class VerificationForm {
  formRef = null;
  isValid = false;
  isSubmitLoading = false;
  onSubmitFunc = null;
  submitCallback = null;
  countdownInterval = null;
  userPhone = null;

  inputRefs = [];
  _arrayValue = ['', '', '', ''];

  constructor({ formRef, submitCallback = null, phone }) {
    this.formRef = formRef;
    this.submitCallback = submitCallback;
    this.userPhone = phone;

    this.updateListeners(e => this.onSubmit.bind(this)(e));
    this.inputRefs[0]?.focus();

    this.countdownInterval = runCountdown({
      ref: this.formRef.resendOTP,
    });
  }

  get arrayValue() {
    return this._arrayValue;
  }

  set arrayValue(newArrayValue) {
    newArrayValue.length = 4;
    this._arrayValue = newArrayValue;

    newArrayValue.forEach((value, index) => {
      const input = this.inputRefs[index];
      if (input) {
        input.value = value;
      }
    });
  }

  validate() {
    const { submitBtn } = this.formRef;

    const isValid = this.inputRefs.every(inputRef =>
      onlyNumbersRegex.test(inputRef.value),
    );

    this.isValid = isValid;

    if (isValid) {
      submitBtn.classList.remove('app-button--disabled');
    } else {
      submitBtn.classList.add('app-button--disabled');
    }
  }

  updateListeners = newSubmitFunc => {
    this.inputRefs = [...this.formRef.otp];

    this.inputRefs.forEach((ref, index) => {
      ref.addEventListener('input', e => this.onInput.bind(this)(e, index));
      ref.addEventListener('keyup', e => this.onKeyUp.bind(this)(e, index));
      ref.addEventListener('keydown', this.onKeyDown.bind(this));
      ref.addEventListener('paste', e => this.onPaste.bind(this)(e));
    });

    if (this.onSubmitFunc) {
      this.formRef.removeEventListener('submit', this.onSubmitFunc);
    }
    this.onSubmitFunc = newSubmitFunc;
    this.formRef.addEventListener('submit', this.onSubmitFunc);

    this.formRef.backBtn.addEventListener('click', () => {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      renderSignUpForm();
    });
    this.formRef.resendOTP.addEventListener('click', async () => {
      await sendOTP(this.userPhone);
      this.countdownInterval = runCountdown({
        ref: this.formRef.resendOTP,
      });
    });
  };

  startSubmit = () => {
    this.isSubmitLoading = true;
    this.formRef.fieldset.disabled = true;
    this.formRef.submitBtn.classList.add('loading');
  };

  finishSubmit = () => {
    this.isSubmitLoading = false;
    if (this.formRef.fieldset) {
      this.formRef.fieldset.disabled = false;
    }
    if (this.formRef.submitBtn) {
      this.formRef.submitBtn.classList.remove('loading');
    }
  };

  handleError = error => {
    const errorMessages = [];

    if (error.response) {
      const validationErrors = error.response?.data?.error?.fields;
      if (validationErrors) {
        errorMessages.push(Object.values(validationErrors).flat());
      }
    } else {
      errorMessages.push([error.message]);
    }

    const searchString = queryString.parse(window.location.search);

    if (
      errorMessages.some(
        ([message]) =>
          message === ERROR_MESSAGES_EN.emailExist ||
          message === ERROR_MESSAGES_EN.phoneExist,
      )
    ) {
      searchString['wallet'] = 'deposit';
      const stringifiedSearch = queryString.stringify(searchString);

      window.location.replace(
        `${import.meta.env.VITE_REDIRECT_URL}/?${stringifiedSearch}`,
      );
      return;
    }

    if (!errorMessages.length) {
      searchString['sign-up'] = true;
      const stringifiedSearch = queryString.stringify(searchString);

      window.location.replace(
        `${import.meta.env.VITE_REDIRECT_URL}/?${stringifiedSearch}`,
      );
      return;
    }

    const enMessageEntries = Object.entries(ERROR_MESSAGES_EN);
    const translations = errorMessages.map(([message]) => {
      const errorKey = enMessageEntries.find(([, value]) => message === value);
      return errorKey?.[0] ? ERROR_MESSAGES_PT[errorKey[0]] : message;
    });

    const errorRef = this.formRef.querySelector('.js-auth-error');
    errorRef.innerHTML = translations.join('<br/>');
    errorRef.classList.add('visible');
  };

  onPaste = e => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').split('');
    this.arrayValue = paste;

    this.validate();
  };

  onKeyDown = e => {
    const keyCode = parseInt(e.key);
    if (
      e.key !== 'Backspace' &&
      e.key !== 'Delete' &&
      e.key !== 'Enter' &&
      e.key !== 'Tab' &&
      !(e.metaKey && e.key === 'v') &&
      !(keyCode >= 0 && keyCode <= 9)
    ) {
      e.preventDefault();
    }
  };

  onInput = (e, index) => {
    const { value } = e.target;
    const input = value[value.length - 1] ?? '';

    // if (input.length > 1) {
    //   e.preventDefault();
    //   this.arrayValue = [...this.arrayValue];

    //   if (index < this.arrayValue.length - 1) {
    //     this.inputRefs[index + 1]?.focus();
    //   }

    //   return false;
    // }

    if (!isNaN(input)) {
      const newArrayValue = [...this.arrayValue];
      newArrayValue[index] = input;

      this.arrayValue = newArrayValue;

      if (input !== '' && index < this.arrayValue.length - 1) {
        this.inputRefs[index + 1]?.focus();
      }
    }

    this.validate();
  };

  onKeyUp = (e, index) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      this.arrayValue[index] = '';

      if (index > 0) {
        this.inputRefs[index - 1]?.focus();
      }
    }

    this.validate();
  };

  onSubmit = async event => {
    event.preventDefault();

    try {
      if (!this.userPhone || !this.isValid || this.isSubmitLoading) return;

      this.startSubmit();

      if (this.arrayValue.join('') !== getFromLS('otp')) {
        throw new Error('Senha incorreta! Por favor, tente novamente!');
      }

      const searchString = queryString.parse(window.location.search);
      const password = generatePassword();

      const body = {
        password,
        phone: this.userPhone,
        nickname: generateId(),
        currency: 'BRL',
        country: 'BR',
        affiliateTag: searchString.click_id ?? '',
        bonusCode: searchString.bonus_code ?? '',
      };

      const { data } = await registerUserViaTelephone(body);

      await sendSms({
        phone: this.userPhone,
        text: `Sua nova senha no Mayan.bet é: ${password}`,
      });

      await this.submitCallback?.();

      searchString.state = data?.autologinToken;
      const stringifiedSearch = queryString.stringify(searchString);

      window.location.replace(
        `${
          import.meta.env.VITE_REDIRECT_URL
        }/auth/autologin/?${stringifiedSearch}`,
      );
    } catch (error) {
      this.handleError(error);
    } finally {
      this.finishSubmit();
    }
  };
}

export const renderVerificationForm = phone => {
  const formMarkup = handlebars.compile(verificationFormTemplate)({
    phone: `+${phone}`,
  });

  modalContentRef.innerHTML = '';
  modalContentRef.insertAdjacentHTML('beforeend', formMarkup);

  new VerificationForm({
    formRef: document.forms.verification,
    submitCallback: async () => {
      setToLS('isAlreadyRegistered', true);
    },
    phone,
  });
};

export const sendOTP = async phone => {
  const lastOTPSent = getFromLS('lastOTPSent') ?? globalState.lastOTPSent;
  const OTPDelayRemaining =
    lastOTPSent - parseInt(Date.now() / 1000) + OTP_DELAY_SECONDS;

  if (lastOTPSent && OTPDelayRemaining > 0) {
    throw new Error(
      `Um novo código pode ser recebido em <span class='js-countdown'>${OTPDelayRemaining}</span> seg`,
    );
  }

  const otp = generatePassword(4);
  setToLS('otp', otp);
  globalState.lastOTPSent = parseInt(Date.now() / 1000);

  await sendSms({
    phone,
    text: `Código de confirmação na Mayan.Bet: ${otp}. Válido por 5 minutos`,
  });
};
