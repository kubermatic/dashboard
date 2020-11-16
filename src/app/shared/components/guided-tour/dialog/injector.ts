// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Injector, Type, InjectionToken} from '@angular/core';

export class DialogInjector implements Injector {
  constructor(private _parentInjector: Injector, private _additionalTokens: WeakMap<any, any>) {}

  get<T>(token: Type<T> | InjectionToken<T>, notFoundValue?: T): Injector {
    const value = this._additionalTokens.get(token);

    if (value) {
      return value;
    }

    return this._parentInjector.get<any>(token, notFoundValue);
  }
}
