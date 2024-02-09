class GlobalState {
  _wheelStage = 1;

  get wheelStage() {
    return this._wheelStage;
  }

  set wheelStage(value) {
    this._wheelStage = value;
  }

  get isLastStage() {
    return this._wheelStage >= 3;
  }
}

export const globalState = new GlobalState();
