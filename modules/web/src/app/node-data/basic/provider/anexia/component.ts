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
import {FormArray, FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import _ from 'lodash';
import {merge, Observable} from 'rxjs';
import {map, filter, takeUntil} from 'rxjs/operators';
import {GlobalModule} from '@core/services/global/module';
import {NodeDataService} from '@core/services/node-data/service';
import {DynamicModule} from '@app/dynamic/module-registry';
import {AutocompleteControls, AutocompleteInitialState} from '@shared/components/autocomplete/component';
import {AnexiaNodeSpec, AnexiaNodeSpecDisk, NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {AnexiaDiskType, AnexiaTemplate, AnexiaVlan} from '@shared/entity/provider/anexia';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {QuotaCalculationService} from '@dynamic/enterprise/quotas/services/quota-calculation';
import {ResourceQuotaCalculationPayload} from '@shared/entity/quota';

enum Controls {
  VlanID = 'vlanID',
  Template = 'template',
  Cpus = 'cpus',
  Memory = 'memory',
  Disks = 'disks',
}

enum DiskControls {
  Size = 'size',
  PerformanceType = 'performanceType',
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
  readonly DiskControls = DiskControls;
  private readonly _defaultDiskSize = 20; // in GiB
  private readonly _defaultCpus = 1;
  private readonly _defaultMemory = 2048; // in MB
  vlans: string[] = [];
  templateIDs: string[] = [];
  templateNames: string[] = [];
  diskTypes: string[] = [];
  isLoadingVlans = false;
  isLoadingTemplates = false;
  isLoadingDiskTypes = false;
  isEnterpriseEdition = DynamicModule.isEnterpriseEdition;

  private _quotaCalculationService: QuotaCalculationService;
  private _initialQuotaCalculationPayload: ResourceQuotaCalculationPayload;

  private get _vlanIdsObservable(): Observable<AnexiaVlan[]> {
    return this._nodeDataService.anexia.vlans(this._clearVlan.bind(this), this._onVlanLoading.bind(this));
  }

  private get _templatesObservable(): Observable<AnexiaVlan[]> {
    return this._nodeDataService.anexia.templates(this._clearTemplate.bind(this), this._onTemplateLoading.bind(this));
  }

  private get _diskTypesObservable(): Observable<AnexiaDiskType[]> {
    return this._nodeDataService.anexia.diskTypes(this._clearDiskType.bind(this), this._onDiskTypeLoading.bind(this));
  }

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();

    if (this.isEnterpriseEdition) {
      this._quotaCalculationService = GlobalModule.injector.get(QuotaCalculationService);
    }
  }

  get disks() {
    return this.form.get(Controls.Disks) as FormArray;
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.VlanID]: this._builder.control('', Validators.required),
      [Controls.Template]: this._builder.control('', Validators.required),
      [Controls.Cpus]: this._builder.control(this._defaultCpus),
      [Controls.Memory]: this._builder.control(this._defaultMemory),
      [Controls.Disks]: this._builder.array([]),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this._vlanIdsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultVlan.bind(this));
    this._templatesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultTemplate.bind(this));
    this._diskTypesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultDiskType.bind(this));

    this.form
      .get(Controls.Disks)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe((disks: AnexiaNodeSpecDisk[]) => {
        if (disks[disks.length - 1].size) {
          this._addDisk({size: 0});
        }
      });

    merge(this.form.get(Controls.Cpus).valueChanges, this.form.get(Controls.Memory).valueChanges)
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
      .get(Controls.Template)
      .valueChanges.pipe(
        filter(form => !!form),
        map(form => form[AutocompleteControls.Main]),
        takeUntil(this._unsubscribe)
      )
      .subscribe(t => {
        if (!this.templateIDs.includes(t)) {
          this._nodeDataService.nodeData.spec.cloud.anexia.template = t;
          this._nodeDataService.nodeData.spec.cloud.anexia.templateID = '';
        } else {
          this._nodeDataService.nodeData.spec.cloud.anexia.templateID = t;
          this._nodeDataService.nodeData.spec.cloud.anexia.template = '';
        }
      });

    this.form
      .get(Controls.Disks)
      .valueChanges.pipe(
        map(form =>
          form
            .filter((disk: AnexiaNodeSpecDisk) => disk[DiskControls.Size])
            .map((disk: any) => ({...disk, [DiskControls.PerformanceType]: disk[DiskControls.PerformanceType]?.main}))
        ),
        takeUntil(this._unsubscribe)
      )
      .subscribe(d => (this._nodeDataService.nodeData.spec.cloud.anexia.disks = d));

    merge(
      this.form.get(Controls.Cpus).valueChanges,
      this.form.get(Controls.Memory).valueChanges,
      this.form.get(Controls.Disks).valueChanges,
      this.form.get(Controls.Template).valueChanges,
      this.form.get(Controls.VlanID).valueChanges
    )
      .pipe(filter(_ => this.isEnterpriseEdition))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        const payload = this._getQuotaCalculationPayload();
        this._quotaCalculationService.refreshQuotaCalculations(payload);
      });
  }

  ngAfterViewChecked(): void {
    // Force initial form validation.
    this.form.updateValueAndValidity();
  }

  ngOnDestroy() {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _addDisk(disk: AnexiaNodeSpecDisk) {
    this.disks.push(
      this._builder.group({
        [DiskControls.Size]: this._builder.control(disk.size),
        [DiskControls.PerformanceType]: this._builder.control({main: disk.performanceType || ''}),
      })
    );
  }

  deleteDisk(index: number) {
    this.disks.removeAt(index);
  }

  isDiskRemovable(index: number): boolean {
    return index < this.disks.length - 1;
  }

  private _init(): void {
    if (this._nodeDataService.nodeData.spec.cloud.anexia) {
      this.form.get(Controls.Cpus).setValue(this._nodeDataService.nodeData.spec.cloud.anexia.cpus);
      this.form.get(Controls.Memory).setValue(this._nodeDataService.nodeData.spec.cloud.anexia.memory);
      const disks = this._nodeDataService.nodeData.spec.cloud.anexia.disks;
      disks?.forEach(disk => {
        this._addDisk(disk);
      });
    }
    if (!this.disks.length) {
      this._addDisk({size: this._defaultDiskSize});
    }
    this._cdr.detectChanges();
  }

  private _onVlanLoading(): void {
    this.isLoadingVlans = true;
    this._cdr.detectChanges();
  }

  private _onTemplateLoading(): void {
    this.isLoadingTemplates = true;
    this._cdr.detectChanges();
  }

  private _onDiskTypeLoading(): void {
    this.isLoadingDiskTypes = true;
    this._cdr.detectChanges();
  }

  private _clearVlan(): void {
    this.vlans = [];
    this.form.get(Controls.VlanID).setValue(AutocompleteInitialState);
    this._cdr.detectChanges();
  }

  private _clearTemplate(): void {
    this.vlans = [];
    this.form.get(Controls.Template).setValue(AutocompleteInitialState);
    this._cdr.detectChanges();
  }

  private _clearDiskType(): void {
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
    this.templateIDs = _.sortBy(templates, t => t.id.toLowerCase()).map(t => t.id);
    this.templateNames = _.sortBy(templates, t => t.name.toLowerCase()).map(t => t.name);
    let selectedTemplate =
      this._nodeDataService.nodeData.spec.cloud.anexia.template ||
      this._nodeDataService.nodeData.spec.cloud.anexia.templateID;
    if (!selectedTemplate && this.templateNames.length > 0) {
      selectedTemplate = this.templateNames[0];
    }
    if (selectedTemplate) {
      this.form.get(Controls.Template).setValue({main: selectedTemplate});
    }
    this._cdr.detectChanges();
  }

  private _setDefaultDiskType(diskTypes: AnexiaDiskType[]): void {
    this.isLoadingDiskTypes = false;
    this.diskTypes = diskTypes.map(dt => dt.id);
    this._cdr.detectChanges();
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          anexia: {
            cpus: this.form.get(Controls.Cpus).value,
            memory: this.form.get(Controls.Memory).value,
          },
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  private _getQuotaCalculationPayload(): ResourceQuotaCalculationPayload {
    let payload: ResourceQuotaCalculationPayload = {
      replicas: this._nodeDataService.nodeData.count,
      anexiaNodeSpec: {
        [Controls.Cpus]: this.form.get(Controls.Cpus).value,
        [Controls.Memory]: this.form.get(Controls.Memory).value,
        [Controls.VlanID]: this.form.get(Controls.VlanID).value?.[AutocompleteControls.Main],
      } as AnexiaNodeSpec,
    };

    const selectedTemplate = this.form.get(Controls.Template).value?.[AutocompleteControls.Main];
    if (!this.templateIDs.includes(selectedTemplate)) {
      payload.anexiaNodeSpec.template = selectedTemplate;
    } else {
      payload.anexiaNodeSpec.templateID = selectedTemplate;
    }

    payload.anexiaNodeSpec.disks = this.form
      .get(Controls.Disks)
      .value.filter((disk: any) => disk[DiskControls.Size])
      .map((disk: any) => ({...disk, [DiskControls.PerformanceType]: disk[DiskControls.PerformanceType]?.main}));

    if (
      !this._nodeDataService.isInWizardMode() &&
      !this._initialQuotaCalculationPayload &&
      !!this._nodeDataService.nodeData.creationTimestamp
    ) {
      this._initialQuotaCalculationPayload = {
        ...payload,
      };
    }

    if (this._initialQuotaCalculationPayload) {
      payload = {
        ...payload,
        replacedResources: this._initialQuotaCalculationPayload,
      } as ResourceQuotaCalculationPayload;
    }

    return payload;
  }
}
