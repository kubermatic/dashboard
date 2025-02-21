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
import {ComboboxControls} from '@shared/components/combobox/component';
import {ClusterTemplate} from '@shared/entity/cluster-template';
import _ from 'lodash';
import {Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

enum TemplateState {
  Ready = 'Cluster Template',
  Loading = 'Loading...',
  Empty = 'No Cluster Templates Available',
}

enum Control {
  ClusterTemplate = 'clusterTemplate',
}

@Component({
    selector: 'km-select-cluster-template',
    templateUrl: './template.html',
    standalone: false
})
export class SelectClusterTemplateComponent implements OnInit, OnDestroy {
  @Input() projectId: string;
  @Input() templateId: string;
  control = Control;
  templates: ClusterTemplate[] = [];
  templateLabel: TemplateState = TemplateState.Ready;
  form: FormGroup;
  private _unsubscribe = new Subject<void>();

  constructor(private readonly _clusterTemplateService: ClusterTemplateService) {}

  ngOnInit() {
    this.form = new FormGroup({[Control.ClusterTemplate]: new FormControl('', [Validators.required])});

    this.templateLabel = TemplateState.Loading;
    this._clusterTemplateService
      .list(this.projectId)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(templates => {
        this.templates = _.sortBy(templates, 'name');
        this.templateLabel = this.templates?.length ? TemplateState.Ready : TemplateState.Empty;
        if (this.templateId) {
          const selectedTemplate = this.templates.find(template => template.id === this.templateId);
          if (selectedTemplate) {
            this.form.controls.clusterTemplate.setValue(selectedTemplate.id);
          }
        }
      });

    this.form
      .get(Control.ClusterTemplate)
      .valueChanges.pipe(map(form => form[ComboboxControls.Select]))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(template => (this._clusterTemplateService.template = this.templates.find(t => t.id === template)));

    this.form.statusChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._clusterTemplateService.templateStepValidity = this.form.valid));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  templateDisplayName(templateId: string): string {
    if (templateId) {
      return this.templates?.find(template => template.id === templateId)?.name || '';
    }
    return templateId;
  }
}
