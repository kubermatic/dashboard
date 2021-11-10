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

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {MLAService} from '@core/services/mla';
import {NotificationService} from '@core/services/notification';
import {Cluster} from '@shared/entity/cluster';
import {RuleGroup, RuleGroupType} from '@shared/entity/mla';
import {getIconClassForButton} from '@shared/utils/common-utils';
import {MLAUtils} from '@shared/utils/mla-utils';
import _ from 'lodash';
import {encode, decode} from 'js-base64';
import {Subject} from 'rxjs';
import {take} from 'rxjs/operators';

export interface RuleGroupDialogData {
  title: string;
  projectId: string;
  cluster: Cluster;
  mode: Mode;
  confirmLabel: string;

  // Rule Group has to be specified only if dialog is used in the edit mode.
  ruleGroup?: RuleGroup;
}

export enum Mode {
  Add = 'add',
  Edit = 'edit',
}

export enum Controls {
  Type = 'type',
}

@Component({
  selector: 'km-rule-group-dialog',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class RuleGroupDialog implements OnInit, OnDestroy {
  readonly Controls = Controls;
  form: FormGroup;
  ruleGroupData = '';
  ruleGroupTypes = Object.values(RuleGroupType);
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _matDialogRef: MatDialogRef<RuleGroupDialog>,
    private readonly _mlaService: MLAService,
    private readonly _notificationService: NotificationService,
    private readonly _builder: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: RuleGroupDialogData
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Type]: this._builder.control(this.data.mode === Mode.Edit ? this.data.ruleGroup.type : '', [
        Validators.required,
      ]),
    });

    this._initProviderConfigEditor();
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isValid(): boolean {
    return !_.isEmpty(this.ruleGroupData) && this.form.valid;
  }

  getIconClass(): string {
    return getIconClassForButton(this.data.confirmLabel);
  }

  save(): void {
    const ruleGroupName = this.data.mode === Mode.Edit ? MLAUtils.getRuleGroupName(this.data.ruleGroup.data) : '';
    const ruleGroup: RuleGroup = {
      data: this._getRuleGroupData(),
      type: this.form.get(Controls.Type).value,
    };

    switch (this.data.mode) {
      case Mode.Add:
        return this._create(ruleGroup);
      case Mode.Edit:
        return this._edit(ruleGroup, ruleGroupName);
    }
  }

  private _create(ruleGroup: RuleGroup): void {
    this._mlaService
      .createRuleGroup(this.data.projectId, this.data.cluster.id, ruleGroup)
      .pipe(take(1))
      .subscribe((result: RuleGroup) => {
        this._matDialogRef.close(true);
        const ruleGroupName = MLAUtils.getRuleGroupName(result.data);
        this._notificationService.success(`The Rule Group ${ruleGroupName} was created`);
        this._mlaService.refreshRuleGroups();
      });
  }

  private _edit(ruleGroup: RuleGroup, ruleGroupName: string): void {
    this._mlaService
      .editRuleGroup(this.data.projectId, this.data.cluster.id, ruleGroup, ruleGroupName)
      .pipe(take(1))
      .subscribe(_ => {
        this._matDialogRef.close(true);
        this._notificationService.success(`The Rule Group ${ruleGroupName} was updated`);
        this._mlaService.refreshRuleGroups();
      });
  }

  private _initProviderConfigEditor(): void {
    if (this.data.mode === Mode.Edit) {
      const data = this.data.ruleGroup.data;
      if (!_.isEmpty(data)) {
        this.ruleGroupData = decode(data);
      }
    }
  }

  private _getRuleGroupData(): string {
    return encode(this.ruleGroupData);
  }
}
