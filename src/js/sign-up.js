import handlebars from 'handlebars';
import queryString from 'query-string';
import {
  AUTH_FIELD,
  ERROR_MESSAGES_EN,
  ERROR_MESSAGES_PT,
  generateId,
  generatePassword,
  getFromLS,
  prepareInputMask,
  registerUserViaTelephone,
  sendMessage,
  setToLS,
  validatePhone,
} from 'mayanbet-sdk';
import signUpFormTemplate from '@/partials/sign-up-form.hbs?raw';
import signUpBonusesTemplate from '@/partials/sign-up-bonuses.hbs?raw';
import firstStepTemplate from '@/partials/sign-up-first-step.html?raw';
import otpStepTemplate from '@/partials/sign-up-otp-step.html?raw';
import { openModal } from '@/js/modal';
import { globalState } from '@/js/global-state';

const modalContentRef = document.querySelector('.js-app-modal-content');
const onlyNumbersRegex = new RegExp('\\d');

const STEPS = {
  first: 'first',
  otp: 'otp',
};

export class SignUpForm {
  formRef = null;
  isValid = false;
  currentStep = STEPS.first;
  isSubmitLoading = false;
  onSubmitFunc = null;
  submitCallback = null;

  constructor({ formRef, submitCallback = null }) {
    this.formRef = formRef;
    this.submitCallback = submitCallback;

    this.updateListeners(e => this.sendOTP.bind(this)(e));
  }

  validate() {
    const { tel, otp, submitBtn, agreeCheck } = this.formRef;

    let isValid = false;

    if (this.currentStep === STEPS.first) {
      isValid =
        onlyNumbersRegex.test(tel.value[tel.value.length - 1]) &&
        agreeCheck.checked;
    } else {
      isValid = onlyNumbersRegex.test(otp.value[otp.value.length - 1]);
    }

    this.isValid = isValid;

    if (isValid) {
      submitBtn.classList.remove('app-button--disabled');
    } else {
      submitBtn.classList.add('app-button--disabled');
    }
  }

  onInput = () => {
    this.validate();
  };

  onChangeCheckbox = () => {
    this.validate();
  };

  updateListeners = newSubmitFunc => {
    prepareInputMask(this.formRef);

    [...this.formRef.elements].forEach(element => {
      switch (element.type) {
        case 'email':
        case 'tel':
        case 'text':
        case 'password':
        case 'number':
          element.addEventListener('input', this.onInput.bind(this));
          break;

        case 'checkbox':
          element.addEventListener('change', this.onChangeCheckbox.bind(this));
          break;

        default:
          break;
      }
    });

    if (this.onSubmitFunc) {
      this.formRef.removeEventListener('submit', this.onSubmitFunc);
    }
    this.onSubmitFunc = newSubmitFunc;
    this.formRef.addEventListener('submit', this.onSubmitFunc);
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

    if (!errorMessages.length) {
      const searchString = queryString.parse(window.location.search);

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

  sendOTP = async event => {
    event.preventDefault();

    try {
      if (!this.isValid || this.isSubmitLoading) return;

      this.startSubmit();

      const rawPhone = this.formRef[AUTH_FIELD.tel].value;
      const phone = `55${rawPhone}`;

      // const { valid } = await validatePhone(phone);

      // if (!valid) {
      //   throw new Error(ERROR_MESSAGES_PT.invalidPhone);
      // }
      const otp = generatePassword(4);
      setToLS('otp', otp);

      // const smsData = {
      //   from: '551151181700',
      //   to: `+${phone}`,
      //   message_body: {
      //     text: `Código de registro Mayan.Bet: ${otp}`,
      //     media: [null],
      //   },
      // };

      // await sendMessage(smsData);

      const otpStepMarkup = handlebars.compile(otpStepTemplate)();
      const stepWrapperRef = this.formRef.querySelector(
        '.js-sign-up-current-step-wrapper',
      );
      stepWrapperRef.innerHTML = '';
      stepWrapperRef.insertAdjacentHTML('beforeend', otpStepMarkup);

      this.currentStep = STEPS.otp;
      this.validate();

      this.updateListeners(e => this.registerUser.bind(this)(e, phone));
    } catch (error) {
      this.handleError(error);
    } finally {
      this.finishSubmit();
    }
  };

  registerUser = async (event, phone) => {
    event.preventDefault();

    try {
      if (!phone || !this.isValid || this.isSubmitLoading) return;

      this.startSubmit();

      if (this.formRef.otp.value !== getFromLS('otp')) {
        throw new Error('Senha incorreta! Por favor, tente novamente!');
      }

      const searchString = queryString.parse(window.location.search);
      const password = generatePassword();

      const body = {
        password,
        phone,
        nickname: generateId(),
        currency: 'BRL',
        country: 'BR',
        affiliateTag: searchString.click_id ?? '',
        bonusCode: searchString.bonus_code ?? '',
      };

      const { data } = await registerUserViaTelephone(body);

      const smsData = {
        from: '551151181700',
        to: `+${phone}`,
        message_body: {
          text: `Sua nova senha no Mayan.bet é: ${password}`,
          media: [null],
        },
      };

      await sendMessage(smsData);

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

export const openSignUpModal = ({ isBlocked } = {}) => {
  const bonusesMarkup = handlebars.compile(signUpBonusesTemplate)({
    wheelStage: globalState.wheelStage,
  });

  const formMarkup = handlebars.compile(signUpFormTemplate)({
    bonusesMarkup,
    title: globalState.wheelStage === 1 ? 'Junte-se a nós' : 'Parabéns',
    submitText:
      globalState.wheelStage === 1 ? 'Inscrever-se' : 'Receba seu bônus',
  });

  modalContentRef.innerHTML = '';
  modalContentRef.insertAdjacentHTML('beforeend', formMarkup);

  const firstStepMarkup = handlebars.compile(firstStepTemplate)();
  const stepWrapperRef = modalContentRef.querySelector(
    '.js-sign-up-current-step-wrapper',
  );
  stepWrapperRef.insertAdjacentHTML('beforeend', firstStepMarkup);

  new SignUpForm({
    formRef: document.forms.signUp,
    submitCallback: async () => {
      setToLS('isAlreadyRegistered', true);
    },
  });

  openModal({ isBlocked });
};
