import handlebars from 'handlebars';
import queryString from 'query-string';
import {
  AUTH_FIELD,
  ERROR_MESSAGES_EN,
  ERROR_MESSAGES_PT,
  generateId,
  prepareInputMask,
  registerUser,
  validatePhone,
} from 'mayanbet-sdk';
import signUpFormTemplate from '@/partials/sign-up-form.hbs?raw';
import signUpBonusesTemplate from '@/partials/sign-up-bonuses.hbs?raw';
import { openModal } from '@/js/modal';
import { globalState } from '@/js/global-state';
import { setToLS } from '@/js/local-storage';
// import { validateEmail } from '@/api';

const modalContentRef = document.querySelector('.js-app-modal-content');

export class SignUpForm {
  formRef = null;
  isValid = false;
  isVisiblePassword = false;
  isSubmitLoading = false;
  submitCallback = null;

  constructor({ formRef, submitCallback = null }) {
    this.formRef = formRef;
    this.submitCallback = submitCallback;

    prepareInputMask(this.formRef);

    [
      this.formRef[AUTH_FIELD.tel],
      this.formRef[AUTH_FIELD.email],
      this.formRef[AUTH_FIELD.password],
    ].forEach(ref => {
      ref.addEventListener('input', this.onInput.bind(this));
    });
    this.formRef.agreeCheck.addEventListener(
      'change',
      this.onChangeCheckbox.bind(this),
    );
    this.formRef.addEventListener('submit', e => this.onSubmit.bind(this)(e));

    const hidePasswordBtnRefs = this.formRef.querySelectorAll(
      '.js-password-input-btn',
    );
    [...hidePasswordBtnRefs].forEach(ref => {
      ref.addEventListener('click', this.togglePasswordVisibility);
    });
  }

  validate() {
    const { tel, email, password, submitBtn, agreeCheck } = this.formRef;
    if (!email || !password || !agreeCheck || !submitBtn) return;
    const onlyNumbersRegex = new RegExp('\\d');

    let isValid =
      email.validity.valid &&
      onlyNumbersRegex.test(tel.value[tel.value.length - 1]) &&
      password.validity.valid &&
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

  onSubmit = async event => {
    event.preventDefault();

    const searchString = queryString.parse(window.location.search);

    try {
      if (!this.isValid || this.isSubmitLoading) return;

      this.isSubmitLoading = true;
      this.formRef.fieldset.disabled = true;
      this.formRef.submitBtn.classList.add('loading');

      const email = this.formRef[AUTH_FIELD.email].value;
      // // Code plus character for query param
      // const codedEmail = email.replace(/\+/g, '%2B');

      // const { isValid } = await validateEmail(codedEmail);

      // if (isValid !== 'Yes') {
      //   throw new Error(ERROR_MESSAGES_PT.invalidEmail);
      // }

      const rawPhone = this.formRef[AUTH_FIELD.tel].value;
      const phone = `55${rawPhone}`;

      const { valid } = await validatePhone(phone);

      if (!valid) {
        throw new Error(ERROR_MESSAGES_PT.invalidPhone);
      }

      const body = {
        email,
        password: this.formRef[AUTH_FIELD.password].value,
        phone,
        nickname: generateId(),
        currency: 'BRL',
        country: 'BR',
        affiliateTag: searchString.click_id ?? '',
        bonusCode: searchString.bonus_code ?? '',
      };

      let responseData = null;

      responseData = (await registerUser(body)).data;

      await this.submitCallback?.();

      searchString.state = responseData?.autologinToken;
      const stringifiedSearch = queryString.stringify(searchString);

      window.location.replace(
        `${
          import.meta.env.VITE_REDIRECT_URL
        }/auth/autologin/?${stringifiedSearch}`,
      );
    } catch (error) {
      const errorMessages = [];

      if (error.response) {
        const validationErrors = error.response?.data?.error?.fields;
        if (validationErrors) {
          errorMessages.push(Object.values(validationErrors).flat());
        }
      } else {
        errorMessages.push([error.message]);
      }

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
        const errorKey = enMessageEntries.find(
          ([, value]) => message === value,
        );
        return errorKey?.[0] ? ERROR_MESSAGES_PT[errorKey[0]] : message;
      });

      const errorRef = this.formRef.querySelector('.js-auth-error');
      errorRef.innerHTML = translations.join('<br/>');
      errorRef.classList.add('visible');
    } finally {
      this.isSubmitLoading = false;
      if (this.formRef.fieldset) {
        this.formRef.fieldset.disabled = false;
      }
      if (this.formRef.submitBtn) {
        this.formRef.submitBtn.classList.remove('loading');
      }
    }
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
}

export const openSignUpModal = ({ isBlocked } = {}) => {
  const bonusesMarkup = handlebars.compile(signUpBonusesTemplate)({
    wheelStage: globalState.wheelStage,
  });

  const markup = handlebars.compile(signUpFormTemplate)({
    bonusesMarkup,
    title: globalState.wheelStage === 1 ? 'Junte-se a nós' : 'Parabéns',
    submitText:
      globalState.wheelStage === 1 ? 'Inscrever-se' : 'Receba seu bônus',
  });

  modalContentRef.innerHTML = '';
  modalContentRef.insertAdjacentHTML('beforeend', markup);

  new SignUpForm({
    formRef: document.forms.signUp,
    submitCallback: async () => {
      setToLS('isAlreadyRegistered', true);
    },
  });

  openModal({ isBlocked });
};
