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

import {animate, state, style, transition, trigger} from '@angular/animations';

export const fadeInOut = trigger('fadeInOut', [
  state(
    'true',
    style({
      overflow: 'hidden',
      height: '*',
    })
  ),
  state(
    'false',
    style({
      opacity: '0',
      overflow: 'hidden',
    })
  ),
  transition('true => false', animate('.5s ease-in-out')),
  transition('false => true', animate('.5s ease-in-out')),
]);
