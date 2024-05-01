import handlebars from 'handlebars';
import queryString from 'query-string';
import {
  AUTH_FIELD,
  ERROR_MESSAGES_EN,
  ERROR_MESSAGES_PT,
  generatePassword,
  prepareInputMask,
  sendMessage,
  setToLS,
  validatePhone,
} from 'mayanbet-sdk';
import signUpFormTemplate from '@/partials/sign-up-form.hbs?raw';
import signUpBonusesTemplate from '@/partials/sign-up-bonuses.hbs?raw';
import { openModal } from '@/js/modal';
import { globalState } from '@/js/global-state';
import { renderVerificationForm } from '@/js/verification-form';

const modalContentRef = document.querySelector('.js-app-modal-content');
const onlyNumbersRegex = new RegExp('\\d');

export class SignUpForm {
  formRef = null;
  isValid = false;
  isSubmitLoading = false;
  onSubmitFunc = null;
  submitCallback = null;

  constructor({ formRef, submitCallback = null }) {
    this.formRef = formRef;
    this.submitCallback = submitCallback;

    this.updateListeners(e => this.sendOTP.bind(this)(e));
  }

  validate() {
    const { tel, submitBtn, agreeCheck } = this.formRef;

    let isValid = false;

    isValid =
      onlyNumbersRegex.test(tel.value[tel.value.length - 1]) &&
      agreeCheck.checked;

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

      const { valid } = await validatePhone(phone);
      if (!valid) {
        throw new Error(ERROR_MESSAGES_PT.invalidPhone);
      }

      const otp = generatePassword(4);
      setToLS('otp', otp);

      const smsData = {
        from: '551151181700',
        to: `+${phone}`,
        message_body: {
          text: `Código de registro Mayan.Bet: ${otp}`,
          media: [null],
        },
      };

      await sendMessage(smsData);

      globalState.lastOTPSent = renderVerificationForm(phone);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.finishSubmit();
    }
  };
}

export const renderSignUpForm = () => {
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

  new SignUpForm({
    formRef: document.forms.signUp,
  });
};

export const openSignUpModal = ({ isBlocked } = {}) => {
  renderSignUpForm();

  openModal({ isBlocked });
};
