import '@/styles/index.scss';

import 'virtual:svg-icons-register';
import queryString from 'query-string';
import '@/plugins';

import '@/js/global-state';
import '@/js/modal';
import { setWheelLastStage } from '@/js/wheel';
import { openSignUpModal } from '@/js/sign-up';
import '@/js/terms-and-privacy';
import useViewportSizes from '@/js/use-viewport-sizes';
import { getFromLS } from '@/js/local-storage';

useViewportSizes();

const isAlreadyRegistered = getFromLS('isAlreadyRegistered');
if (isAlreadyRegistered) {
  const searchString = queryString.parse(window.location.search);

  searchString['sign-in'] = true;
  const stringifiedSearch = queryString.stringify(searchString);

  window.location.replace(
    `${import.meta.env.VITE_REDIRECT_URL}/?${stringifiedSearch}`,
  );
}

const isLastStage = getFromLS('isLastStage');
if (isLastStage) {
  setWheelLastStage();
  openSignUpModal({ isBlocked: true });
}
