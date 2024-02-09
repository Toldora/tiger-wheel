import { debounce } from 'lodash-es';

let assignVhCssVariableDebounced;

const useViewportSizes = () => {
  const assignVhCssVariable = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  assignVhCssVariableDebounced = debounce(assignVhCssVariable, 300);
  assignVhCssVariable();
  window.addEventListener('resize', assignVhCssVariableDebounced);
};

export default useViewportSizes;
