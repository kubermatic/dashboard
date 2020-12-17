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

import {ConnectionPositionPair} from '@angular/cdk/overlay';

export enum GuidedTourID {
  StartTour = 'km-gt-start-tour',
  AddProjectBtn = 'km-gt-add-project-btn',
  AddProjectDialog = 'km-gt-add-project-dialog',
  ProjectItem = 'km-gt-project-item',
}

export const POSITION_MAP: {[key: string]: ConnectionPositionPair} = {
  top: new ConnectionPositionPair(
    {originX: 'center', originY: 'top'},
    {overlayX: 'center', overlayY: 'bottom'},
    0,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    -10
  ),
  bottom: new ConnectionPositionPair(
    {originX: 'start', originY: 'bottom'},
    {overlayX: 'start', overlayY: 'top'},
    0,
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    10
  ),
  left: new ConnectionPositionPair(
    {originX: 'start', originY: 'top'},
    {overlayX: 'end', overlayY: 'top'},
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    -10,
    0
  ),
  right: new ConnectionPositionPair(
    {originX: 'end', originY: 'top'},
    {overlayX: 'start', overlayY: 'top'},
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    10,
    0
  ),
};

export class GuidedTourUtils {}
