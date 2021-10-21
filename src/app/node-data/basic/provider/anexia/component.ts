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

import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {NodeDataService} from '@core/services/node-data/service';
import {AutocompleteControls, AutocompleteInitialState} from '@shared/components/autocomplete/component';
import {NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {AnexiaTemplate, AnexiaVlan} from '@shared/entity/provider/anexia';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {merge, Observable} from 'rxjs';
import {filter, map, takeUntil} from 'rxjs/operators';

enum Controls {
  VlanID = 'vlanID',
  TemplateID = 'templateID',
  Cpus = 'cpus',
  Memory = 'memory',
  DiskSize = 'diskSize',
}

@Component({
  selector: 'km-anexia-basic-node-data',
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AnexiaBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => AnexiaBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnexiaBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy, AfterViewChecked {
  readonly Controls = Controls;
  private readonly _defaultDiskSize = 20; // in GiB
  private readonly _defaultCpus = 1;
  private readonly _defaultMemory = 2048; // in MB
  vlans: string[] = [];
  templates: string[] = [];
  isLoadingVlans = false;
  isLoadingTemplates = false;

  private get _vlanIdsObservable(): Observable<AnexiaVlan[]> {
    return this._nodeDataService.anexia.vlans(this._clearVlan.bind(this), this._onVlanLoading.bind(this));
  }

  private get _templateIdsObservable(): Observable<AnexiaVlan[]> {
    return this._nodeDataService.anexia.templates(this._clearTemplate.bind(this), this._onTemplateLoading.bind(this));
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.VlanID]: this._builder.control('', Validators.required),
      [Controls.TemplateID]: this._builder.control('', Validators.required),
      [Controls.Cpus]: this._builder.control(this._defaultCpus, Validators.required),
      [Controls.Memory]: this._builder.control(this._defaultMemory, Validators.required),
      [Controls.DiskSize]: this._builder.control(this._defaultDiskSize, Validators.required),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this._vlanIdsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultVlan.bind(this));
    this._templateIdsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultTemplate.bind(this));

    merge(
      this.form.get(Controls.Cpus).valueChanges,
      this.form.get(Controls.Memory).valueChanges,
      this.form.get(Controls.DiskSize).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));

    this.form
      .get(Controls.VlanID)
      .valueChanges.pipe(
        filter(form => !!form),
        map(form => form[AutocompleteControls.Main]),
        takeUntil(this._unsubscribe)
      )
      .subscribe(v => (this._nodeDataService.nodeData.spec.cloud.anexia.vlanID = v));

    this.form
      .get(Controls.TemplateID)
      .valueChanges.pipe(
        filter(form => !!form),
        map(form => form[AutocompleteControls.Main]),
        takeUntil(this._unsubscribe)
      )
      .subscribe(t => (this._nodeDataService.nodeData.spec.cloud.anexia.templateID = t));
  }

  ngAfterViewChecked(): void {
    // Force initial form validation.
    this.form.updateValueAndValidity();
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.anexia) {
      this.form.get(Controls.Cpus).setValue(this._nodeDataService.nodeData.spec.cloud.anexia.cpus);
      this.form.get(Controls.Memory).setValue(this._nodeDataService.nodeData.spec.cloud.anexia.memory);
      this.form.get(Controls.DiskSize).setValue(this._nodeDataService.nodeData.spec.cloud.anexia.diskSize);

      this._cdr.detectChanges();
    }
  }

  private _onVlanLoading(): void {
    this.isLoadingVlans = true;
    this._clearVlan();
    this._cdr.detectChanges();
  }

  private _onTemplateLoading(): void {
    this.isLoadingTemplates = true;
    this._clearTemplate();
    this._cdr.detectChanges();
  }

  private _clearVlan(): void {
    this.vlans = [];
    this.form.get(Controls.VlanID).setValue(AutocompleteInitialState);
    this._cdr.detectChanges();
  }

  private _clearTemplate(): void {
    this.vlans = [];
    this.form.get(Controls.TemplateID).setValue(AutocompleteInitialState);
    this._cdr.detectChanges();
  }

  private _setDefaultVlan(vlans: AnexiaVlan[]): void {
    this.isLoadingVlans = false;
    this.vlans = _.sortBy(vlans, v => v.id.toLowerCase()).map(v => v.id);
    let selectedVlan = this._nodeDataService.nodeData.spec.cloud.anexia.vlanID;

    if (!selectedVlan && this.vlans.length > 0) {
      selectedVlan = this.vlans[0];
    }

    this.form.get(Controls.VlanID).setValue({main: selectedVlan});
    this._cdr.detectChanges();
  }

  private _setDefaultTemplate(templates: AnexiaTemplate[]): void {
    this.isLoadingTemplates = false;
    this.templates = _.sortBy(templates, t => t.id.toLowerCase()).map(t => t.id);
    let selectedTemplate = this._nodeDataService.nodeData.spec.cloud.anexia.templateID;

    if (!selectedTemplate && this.templates.length > 0) {
      selectedTemplate = this.templates[0];
    }

    this.form.get(Controls.TemplateID).setValue({main: selectedTemplate});
    this._cdr.detectChanges();
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          anexia: {
            cpus: this.form.get(Controls.Cpus).value,
            memory: this.form.get(Controls.Memory).value,
            diskSize: this.form.get(Controls.DiskSize).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
