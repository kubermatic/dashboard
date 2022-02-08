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

import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ClusterTemplateService} from '@core/services/cluster-templates';
import {AutocompleteControls} from '@shared/components/autocomplete/component';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

enum Control {
  ClusterTemplate = 'clusterTemplate',
}

@Component({
  selector: 'km-select-cluster-template',
  templateUrl: './template.html',
})
export class SelectClusterTemplateComponent implements OnInit, OnDestroy {
  @Input() projectId: string;
  control = Control;
  templates: ClusterTemplate[] = [];
  templateNames: string[] = [];
  isLoadingTemplates = true;
  form: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _clusterTemplateService: ClusterTemplateService) {}

  ngOnInit() {
    this.form = new FormGroup({[Control.ClusterTemplate]: new FormControl('', [Validators.required])});

    this._clusterTemplateService
      .list(this.projectId)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(templates => {
        this.templates = templates;
        this.templateNames = templates.map(t => t.name).sort();
        this.isLoadingTemplates = false;
      });

    this.form
      .get(Control.ClusterTemplate)
      .valueChanges.pipe(map(form => form[AutocompleteControls.Main]))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(template => (this._clusterTemplateService.template = this.templates.find(t => t.name === template)));

    this.form.statusChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterTemplateService.templateStepValidity = this.form.valid));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }
}
