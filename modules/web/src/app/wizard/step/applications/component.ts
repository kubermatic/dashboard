// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {Component, EventEmitter, forwardRef, OnDestroy, OnInit, Output} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR} from '@angular/forms';
import {StepBase} from '@app/wizard/step/base';
import {WizardService} from '@core/services/wizard/wizard';
import {ApplicationsListView} from '@shared/components/application-list/component';
import {Application} from '@shared/entity/application';

enum Controls {
  Applications = 'applications',
}

@Component({
  selector: 'km-wizard-applications-step',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ApplicationsStepComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ApplicationsStepComponent),
      multi: true,
    },
  ],
})
export class ApplicationsStepComponent extends StepBase implements OnInit, OnDestroy {
  readonly ApplicationsListView = ApplicationsListView;

  @Output() applicationsChange = new EventEmitter<Application[]>();

  applications: Application[] = [];

  constructor(wizard: WizardService, private readonly _builder: FormBuilder) {
    super(wizard, 'Applications');
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Applications]: this._builder.control(''),
    });
  }

  onApplicationAdded(application: Application): void {
    application.id = `${application.name}/${application.spec.namespace.name}`;
    this.applications = [...this.applications, application];
    this._onApplicationsChanged();
  }

  onApplicationUpdated(updatedApplication: Application): void {
    const oldApplication = this.applications.find(application => application.id === updatedApplication.id);
    if (oldApplication) {
      oldApplication.name = updatedApplication.name;
      oldApplication.namespace = updatedApplication.namespace;
      oldApplication.spec = updatedApplication.spec;
      oldApplication.id = `${updatedApplication.name}/${updatedApplication.spec.namespace.name}`;
    }
    this.applications = [...this.applications];
    this._onApplicationsChanged();
  }

  onApplicationDeleted(deletedApplication: Application): void {
    this.applications = this.applications.filter(application => application.id !== deletedApplication.id);
    this._onApplicationsChanged();
  }

  private _onApplicationsChanged() {
    const applicationsWithoutIds = this.applications.map(application => ({...application, id: null}));
    this.applicationsChange.emit(applicationsWithoutIds);
  }
}
