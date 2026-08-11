// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {Injectable} from '@angular/core';
import {CanMatch, Route, UrlSegment} from '@angular/router';
import {DynamicModule} from '@app/dynamic/module-registry';

// Blocks enterprise-only routes in community edition builds so they fall through to the 404 page
// instead of resolving to an empty stub module. CanMatch avoids fetching the stub chunk at all.
@Injectable()
export class EnterpriseEditionGuard implements CanMatch {
  canMatch(_route: Route, _segments: UrlSegment[]): boolean {
    return DynamicModule.isEnterpriseEdition;
  }
}
