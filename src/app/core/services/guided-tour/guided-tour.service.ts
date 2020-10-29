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

import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {finalize} from 'rxjs/operators';

import {GuidedTourOptions, GuidedTourStepInfo} from '@shared/entity/guided-tour';
import {GuidedTourID} from '@shared/utils/guided-tour-utils/guided-tour-utils';
import {GuidedTourStepService} from './guided-tour-step.service';
import {GuidedTourOptionsService} from './guided-tour-options.service';

@Injectable()
export class GuidedTourService {
  private _tourInProgress = false;
  private tour$: Observable<GuidedTourStepInfo>;

  constructor(
    private readonly _guidedTourStepService: GuidedTourStepService,
    private readonly _guidedTourOptionsService: GuidedTourOptionsService
  ) {}

  startTour(): void {
    const options: GuidedTourOptions = {
      steps: this.getGuidedTourOrder(),
      showPrevButton: true,
      stepDefaultPosition: 'top',
      startWith: 'km-gt-start-tour',
    };

    if (!this._tourInProgress) {
      this._tourInProgress = true;
      if (options) {
        this._guidedTourOptionsService.setOptions(options);
      }
      this.tour$ = this._guidedTourStepService.startTour().pipe(finalize(() => (this._tourInProgress = false)));
      this.tour$.subscribe();
    }
  }

  closeTour(): void {
    if (this.isTourInProgress()) {
      this._guidedTourStepService.close();
    }
  }

  isTourInProgress(): boolean {
    return this._tourInProgress;
  }

  getGuidedTourOrder(): string[] {
    return [
      GuidedTourID.StartTour,
      GuidedTourID.AddProjectBtn,
      GuidedTourID.AddProjectDialog,
      GuidedTourID.ProjectItem,
      GuidedTourID.ProjectDropdown,
      GuidedTourID.ClusterMenu,
      GuidedTourID.SSHKeyMenu,
      GuidedTourID.MembersMenu,
      GuidedTourID.ServiceaccountMenu,
      GuidedTourID.AddClusterBtn,
      GuidedTourID.WizardStepProvider,
      GuidedTourID.WizardStepDatacenter,
      GuidedTourID.WizardStepCluster,
      GuidedTourID.WizardStepSettings,
      GuidedTourID.WizardStepNodes,
      GuidedTourID.WizardStepSummary,
      GuidedTourID.ClusterList,
      GuidedTourID.ClusterDetailsConnect,
      GuidedTourID.ClusterDetailsEdit,
      GuidedTourID.ClusterDetailsEvents,
      GuidedTourID.ClusterDetailsMachineDeployments,
      GuidedTourID.MDDetailsNodes,
      GuidedTourID.MDDetailsEdit,
      GuidedTourID.MDDetailsBackToCluster,
      GuidedTourID.HelpMenu,
    ];
  }
}
