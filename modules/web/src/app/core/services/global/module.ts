// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
