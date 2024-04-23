import '@/styles/index.scss';

import 'virtual:svg-icons-register';
import { getFromLS } from 'mayanbet-sdk';
import '@/plugins';

import '@/js/global-state';
import '@/js/modal';
import { setWheelLastStage } from '@/js/wheel';
import { openPrizeModal } from '@/js/prize-modal';
import '@/js/terms-and-privacy';
import useViewportSizes from '@/js/use-viewport-sizes';

useViewportSizes();

const isLastStage = getFromLS('isLastStage');
if (isLastStage) {
  setWheelLastStage();
  openPrizeModal({ isBlocked: true });
}
