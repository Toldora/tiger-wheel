import { globalState } from '@/js/global-state';
import { getFromLS } from 'mayanbet-sdk';

export const runCountdown = ({
  ref,
  disabledClass = 'verification-form__resend-otp-btn--disabled',
  targetDelay = 60,
  lastOTPSent = getFromLS('lastOTPSent') ?? globalState.lastOTPSent,
}) => {
  let secondsRemaining =
    lastOTPSent - parseInt(Date.now() / 1000) + targetDelay;

  ref.classList.add(disabledClass);

  const countdownRef = ref.querySelector('.js-countdown');

  if (!countdownRef) return;

  const interval = setInterval(() => {
    secondsRemaining -= 1;

    countdownRef.textContent = secondsRemaining;

    if (secondsRemaining < 0) {
      clearInterval(interval);
      ref.classList.remove(disabledClass);

      setTimeout(() => {
        countdownRef.textContent = targetDelay;
      }, 500);
    }
  }, 1000);

  return interval;
};
