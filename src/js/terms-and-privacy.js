import handlebars from 'handlebars';
import { openModal } from '@/js/modal';
import template from '@/partials/terms.html?raw';

const markup = handlebars.compile(template)();

const termsBtnRefs = document.querySelectorAll('.js-terms-btn');
const policyBtnRefs = document.querySelectorAll('.js-privacy-policy-btn');
const modalContentRef = document.querySelector('.js-app-modal-content');

const onOpenModal = () => {
  modalContentRef.insertAdjacentHTML('beforeend', markup);

  openModal();
};

[...termsBtnRefs].forEach(ref => {
  ref.addEventListener('click', onOpenModal);
});

[...policyBtnRefs].forEach(ref => {
  ref.addEventListener('click', onOpenModal);
});
