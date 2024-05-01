import { setToLS } from 'mayanbet-sdk';

class GlobalState {
  _wheelStage = 1;
  _lastOTPSent = null;

  get wheelStage() {
    return this._wheelStage;
  }

  set wheelStage(value) {
    this._wheelStage = value;
  }

  get isLastStage() {
    return this._wheelStage >= 3;
  }

  get lastOTPSent() {
    return this._lastOTPSent;
  }

  set lastOTPSent(value) {
    setToLS('lastOTPSent', value);
    this._lastOTPSent = value;
  }
}

export const globalState = new GlobalState();
