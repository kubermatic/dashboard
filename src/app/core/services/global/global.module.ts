import {Injector, NgModule} from '@angular/core';

@NgModule()
export class GlobalModule {
  private static _injector: Injector;

  constructor(injector: Injector) {
    GlobalModule.injector = injector;
  }

  static set injector(i: Injector) {
    if (!this._injector) {
      this._injector = i;
    }
  }

  static get injector(): Injector {
    return this._injector;
  }
}
