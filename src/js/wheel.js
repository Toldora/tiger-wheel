import { globalState } from '@/js/global-state';
import { setToLS } from '@/js/local-storage';
import { openSignUpModal } from '@/js/sign-up';

const wheelRef = document.querySelector('.js-wheel');
const spinWheelBtnRef = document.querySelector('.js-spin-wheel-btn');
const bonusesSectionRef = document.querySelector('.js-bonuses-section');
const bodyRef = document.body;
const wheelMainPartRef = wheelRef.querySelector('.js-wheel-main-part');
const wheelMainPartStyles = getComputedStyle(wheelMainPartRef);

const state = {
  isSpinning: false,
};

const onClickWheel = () => {
  if (state.isSpinning) return;

  state.isSpinning = true;

  switch (globalState.wheelStage) {
    case 1:
      wheelRef.classList.add('wheel--spinning-1');
      break;

    case 2:
      wheelRef.classList.add('wheel--spinning-2');
      break;

    default:
      break;
  }

  const delay = Number.parseFloat(wheelMainPartStyles.animationDuration) * 1000;

  setTimeout(() => {
    switch (globalState.wheelStage) {
      case 1:
        bodyRef.classList.add('wheel-stage-2');
        bodyRef.classList.remove('wheel-stage-1');
        wheelRef.classList.remove('wheel--spinning-1');
        bonusesSectionRef.classList.add('bonuses-section--visible-first-bonus');
        globalState.wheelStage += 1;

        break;

      case 2:
        bodyRef.classList.add('wheel-stage-3');
        bodyRef.classList.remove('wheel-stage-2');
        wheelRef.classList.remove('wheel--spinning-2');
        bonusesSectionRef.classList.add(
          'bonuses-section--visible-second-bonus',
        );
        globalState.wheelStage += 1;

        setToLS('isLastStage', globalState.isLastStage);

        setTimeout(() => {
          openSignUpModal({ isBlocked: true });
        }, 500);

        break;

      default:
        break;
    }

    state.isSpinning = false;
  }, delay);
};

export const setWheelLastStage = () => {
  bodyRef.classList.add('wheel-stage-3');
  bodyRef.classList.remove('wheel-stage-1', 'wheel-stage-2');
  bonusesSectionRef.classList.add(
    'bonuses-section--visible-first-bonus',
    'bonuses-section--visible-second-bonus',
  );
  globalState.wheelStage = 3;
};

wheelRef.addEventListener('click', onClickWheel);
spinWheelBtnRef.addEventListener('click', onClickWheel);
