import handlebars from 'handlebars';
import queryString from 'query-string';
import template from '@/partials/sign-up-form.hbs?raw';
import { registerUser, registerUserViaTelephone } from '@/api/registration';
import { openModal } from '@/js/modal';
// import { openLoginModal } from '@/js//login';
import { globalState } from '@/js/global-state';
import { setToLS } from '@/js/local-storage';
import { prepareInputMask } from '@/js/prepare-input-mask';
import { generateId } from '@/js/generate-id';
import { AUTH_FIELD, ERROR_MESSAGES } from '@/const';

const modalContentRef = document.querySelector('.js-app-modal-content');
let formRef = null;

const state = {
  isValid: false,
  isTelAuthType: true,
  isVisiblePassword: false,
  isSubmitLoading: false,
};

const validate = () => {
  const { tel, email, password, submitBtn, agreeCheck } = formRef;
  if (!email || !password || !agreeCheck || !submitBtn) return;

  let isValid = false;

  if (state.isTelAuthType) {
    const onlyNumbersRegex = new RegExp('\\d');
    isValid =
      onlyNumbersRegex.test(tel.value[tel.value.length - 1]) &&
      password.validity.valid &&
      agreeCheck.checked;
  } else {
    isValid =
      email.validity.valid && password.validity.valid && agreeCheck.checked;
  }

  state.isValid = isValid;

  if (isValid) {
    submitBtn.classList.remove('app-button--disabled');
  } else {
    submitBtn.classList.add('app-button--disabled');
  }
};

function onChangeAuthType() {
  const isTel = this.value === AUTH_FIELD.tel;

  state.isTelAuthType = isTel;

  if (isTel) {
    formRef.classList.remove('sign-up-form__form--auth-with-email');
    formRef.classList.add('sign-up-form__form--auth-with-tel');

    formRef[AUTH_FIELD.tel].required = true;
    formRef[AUTH_FIELD.email].required = false;
    formRef[AUTH_FIELD.email].value = '';
  } else {
    formRef.classList.remove('sign-up-form__form--auth-with-tel');
    formRef.classList.add('sign-up-form__form--auth-with-email');
    formRef[AUTH_FIELD.tel].required = false;
    formRef[AUTH_FIELD.email].required = true;
    formRef[AUTH_FIELD.tel].value = '';
  }

  const errorRef = formRef.querySelector('.js-auth-error');
  errorRef.classList.remove('visible');

  validate();
}

const onInput = () => {
  validate();
};

const onChangeCheckbox = () => {
  validate();
};

const onSubmit = async event => {
  event.preventDefault();

  const searchString = queryString.parse(window.location.search);

  try {
    if (!state.isValid || state.isSubmitLoading) return;

    state.isSubmitLoading = true;
    formRef.fieldset.disabled = true;
    formRef.submitBtn.classList.add('loading');

    const defaultBody = {
      password: formRef[AUTH_FIELD.password].value,
      nickname: generateId(),
      currency: 'BRL',
      country: 'BR',
      affiliateTag: searchString.click_id ?? '',
      bonusCode: searchString.bonus_code ?? '',
    };

    let responseData = null;

    if (state.isTelAuthType) {
      const rawPhone = formRef[AUTH_FIELD.tel].value;
      const body = {
        ...defaultBody,
        phone: rawPhone.replace(/[^\d]/g, ''), // Remove all characters except numbers
      };

      responseData = (await registerUserViaTelephone(body)).data;
    } else {
      const body = {
        ...defaultBody,
        email: formRef[AUTH_FIELD.email].value,
      };

      responseData = (await registerUser(body)).data;
    }

    setToLS('isAlreadyRegistered', true);

    searchString.state = responseData?.autologinToken;
    const stringifiedSearch = queryString.stringify(searchString);

    window.location.replace(
      `${
        import.meta.env.VITE_REDIRECT_URL
      }/auth/autologin/?${stringifiedSearch}`,
    );
  } catch (error) {
    const emailError = error.response?.data?.error?.fields?.email[0];
    if (!emailError || emailError === ERROR_MESSAGES.playerExist) {
      searchString['sign-up'] = true;
      const stringifiedSearch = queryString.stringify(searchString);

      window.location.replace(
        `${import.meta.env.VITE_REDIRECT_URL}/?${stringifiedSearch}`,
      );
      return;
    }

    const errorRef = formRef.querySelector('.js-auth-error');
    errorRef.textContent = emailError;
    errorRef.classList.add('visible');
  } finally {
    state.isSubmitLoading = false;
    if (formRef.fieldset) {
      formRef.fieldset.disabled = false;
    }
    if (formRef.submitBtn) {
      formRef.submitBtn.classList.remove('loading');
    }
  }
};

function togglePasswordVisibility() {
  if (state.isVisiblePassword) {
    this.classList.add('sign-up-form__password-input-btn--pass-hidden');
    this.previousElementSibling.type = 'password';
  } else {
    this.classList.remove('sign-up-form__password-input-btn--pass-hidden');
    this.previousElementSibling.type = 'text';
  }
  state.isVisiblePassword = !state.isVisiblePassword;
}

export const openSignUpModal = ({ isBlocked } = {}) => {
  const markup = handlebars.compile(template)({
    wheelStage: globalState.wheelStage,
  });

  modalContentRef.innerHTML = '';
  modalContentRef.insertAdjacentHTML('beforeend', markup);

  formRef = document.forms.signUp;

  prepareInputMask();

  [...formRef[AUTH_FIELD.authType]].forEach(radioRef => {
    radioRef.addEventListener('change', onChangeAuthType);
  });
  [
    formRef[AUTH_FIELD.tel],
    formRef[AUTH_FIELD.email],
    formRef[AUTH_FIELD.password],
  ].forEach(ref => {
    ref.addEventListener('input', onInput);
  });
  formRef.agreeCheck.addEventListener('change', onChangeCheckbox);
  formRef.addEventListener('submit', onSubmit);

  const hidePasswordBtnRefs = formRef.querySelectorAll(
    '.js-password-input-btn',
  );
  [...hidePasswordBtnRefs].forEach(ref => {
    ref.addEventListener('click', togglePasswordVisibility);
  });

  // const loginBtnRef = formRef.querySelector('.js-switch-to-login-btn');
  // loginBtnRef.addEventListener('click', () => {
  //   openLoginModal({ isBlocked });
  //   state.isVisiblePassword = false;
  // });

  openModal({ isBlocked });
};
