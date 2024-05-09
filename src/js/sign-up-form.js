import handlebars from 'handlebars';
import queryString from 'query-string';
import { AUTH_FIELD, ERROR_MESSAGES_EN, ERROR_MESSAGES_PT } from 'mayanbet-sdk';
import signUpFormTemplate from '@/partials/sign-up-form.hbs?raw';
import signUpBonusesTemplate from '@/partials/sign-up-bonuses.hbs?raw';
import { openModal } from '@/js/modal';
import { globalState } from '@/js/global-state';
import { renderVerificationForm, sendOTP } from '@/js/verification-form';
import { runCountdown } from '@/js/countdown';
import { validateEmail } from '@/api';

const modalContentRef = document.querySelector('.js-app-modal-content');

export class SignUpForm {
  formRef = null;
  isValid = false;
  isSubmitLoading = false;
  onSubmitFunc = null;
  submitCallback = null;
  countdownInterval = null;

  constructor({ formRef, submitCallback = null }) {
    this.formRef = formRef;
    this.submitCallback = submitCallback;

    this.updateListeners(e => this.onSubmit.bind(this)(e));
  }

  validate() {
    const { email, password, submitBtn, agreeCheck } = this.formRef;

    const isValid =
      email.validity.valid && password.validity.valid && agreeCheck.checked;

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

  togglePasswordVisibility() {
    if (this.isVisiblePassword) {
      this.classList.add('sign-up-form__password-input-btn--pass-hidden');
      this.previousElementSibling.type = 'password';
    } else {
      this.classList.remove('sign-up-form__password-input-btn--pass-hidden');
      this.previousElementSibling.type = 'text';
    }
    this.isVisiblePassword = !this.isVisiblePassword;
  }

  updateListeners = newSubmitFunc => {
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

    const hidePasswordBtnRefs = this.formRef.querySelectorAll(
      '.js-password-input-btn',
    );
    [...hidePasswordBtnRefs].forEach(ref => {
      ref.addEventListener('click', this.togglePasswordVisibility);
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
    if (translations[0]?.startsWith('Um novo código')) {
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      this.countdownInterval = runCountdown({
        ref: errorRef,
        disabledClass: 'visible',
      });
    }
    errorRef.classList.add('visible');
  };

  onSubmit = async event => {
    event.preventDefault();

    try {
      if (!this.isValid || this.isSubmitLoading) return;

      this.startSubmit();

      const email = this.formRef[AUTH_FIELD.email].value;
      // Code plus character for query param
      const codedEmail = email.replace(/\+/g, '%2B');

      const { isValid } = await validateEmail(codedEmail);

      if (isValid !== 'Yes') {
        throw new Error(ERROR_MESSAGES_PT.invalidEmail);
      }

      const password = this.formRef[AUTH_FIELD.password].value;

      await sendOTP(email);

      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      renderVerificationForm({ email, password });
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
