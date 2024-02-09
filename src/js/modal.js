const appModalRef = document.querySelector('.js-app-modal');
const closeBtnRef = appModalRef.querySelector('.js-close-modal-btn');
const modalContentRef = document.querySelector('.js-app-modal-content');

const modalStyles = getComputedStyle(appModalRef);

const state = {
  isOpenedModal: false,
};

export const openModal = ({ isBlocked } = {}) => {
  appModalRef.classList.add(
    'app-modal__overlay--animation',
    'app-modal__overlay--is-visible',
  );

  if (!isBlocked) {
    appModalRef.addEventListener('click', onClickOverlay);
    closeBtnRef.addEventListener('click', closeModal);
  }

  state.isOpenedModal = true;
};

const closeModal = event => {
  event.stopPropagation();

  const delay = Number.parseFloat(modalStyles.transitionDuration) * 1000;

  appModalRef.classList.remove('app-modal__overlay--is-visible');

  appModalRef.removeEventListener('click', onClickOverlay);
  closeBtnRef.removeEventListener('click', closeModal);

  state.isOpenedModal = false;

  setTimeout(() => {
    appModalRef.classList.remove('app-modal__overlay--animation');
    modalContentRef.innerHTML = '';
  }, delay);
};

const onClickOverlay = event => {
  if (event.target !== event.currentTarget || !state.isOpenedModal) return;

  closeModal(event);
};
