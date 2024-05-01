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
    return this.__lastOTPSent;
  }

  set lastOTPSent(value) {
    this.__lastOTPSent = value;
  }
}

export const globalState = new GlobalState();
