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

import {Component, forwardRef, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {PresetDialogService} from '@app/settings/admin/presets/dialog/steps/service';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {takeUntil} from 'rxjs/operators';
import {EMAIL_DOMAIN_VALIDOTOR, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR} from '@shared/validators/others';
import {ProjectService} from '@app/core/services/project';
import {Project} from '@app/shared/entity/project';

enum Controls {
  Name = 'name',
  Domains = 'domains',
  Projects = 'projects',
  Disable = 'disable',
}

enum ProjectState {
  Ready = 'Projects',
  Loading = 'Loading...',
  Empty = 'No Projects Available',
}

@Component({
    selector: 'km-preset-step',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PresetStepComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PresetStepComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class PresetStepComponent extends BaseFormValidator implements OnInit {
  readonly controls = Controls;
  readonly emailAndDomainRegex = EMAIL_DOMAIN_VALIDOTOR;

  domains: string[] = [];
  projects: Project[] = [];
  projectLabel = ProjectState.Ready;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _presetDialogService: PresetDialogService,
    private readonly _projectService: ProjectService
  ) {
    super();
  }

  ngOnInit(): void {
    this._initForm();
    this._getProjects();

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this._update());
  }

  onDomainsChange(domains: string[]): void {
    this.domains = domains;
    this.form.get(Controls.Domains).updateValueAndValidity();
    this._presetDialogService.preset.spec.requiredEmails = this.domains;
  }

  projectDisplayFn(projectId: string[]): string {
    if (projectId) {
      return projectId
        ?.map(id => {
          return this.projects.find(project => project.id === id)?.name;
        })
        .join(', ');
    }
    return '';
  }

  private _update(): void {
    this._presetDialogService.preset.spec.projects = this.form.get(Controls.Projects).value.select;
    this._presetDialogService.preset.metadata.name = this.form.get(Controls.Name).value;
    this._presetDialogService.preset.spec.enabled = !this.form.get(Controls.Disable).value;
  }

  private _getProjects(): void {
    this.projectLabel = ProjectState.Loading;

    this._projectService.allProjects.pipe(takeUntil(this._unsubscribe)).subscribe((projects: Project[]) => {
      this.projects = projects;
      this.projectLabel = this.projects.length ? ProjectState.Ready : ProjectState.Empty;
    });
  }

  private _initForm(): void {
    this.form = this._builder.group({
      [Controls.Name]: this._builder.control('', [Validators.required, KUBERNETES_RESOURCE_NAME_PATTERN_VALIDATOR]),
      [Controls.Domains]: this._builder.control([]),
      [Controls.Projects]: this._builder.control([]),
      [Controls.Disable]: this._builder.control(''),
    });
  }
}
