import handlebars from 'handlebars';
import modalTemplate from '@/partials/prize-modal.hbs?raw';
import { openModal } from '@/js/modal';

const modalContentRef = document.querySelector('.js-app-modal-content');

export const openPrizeModal = ({ isBlocked } = {}) => {
  const markup = handlebars.compile(modalTemplate)();

  modalContentRef.innerHTML = '';
  modalContentRef.insertAdjacentHTML('beforeend', markup);

  openModal({ isBlocked });
};
