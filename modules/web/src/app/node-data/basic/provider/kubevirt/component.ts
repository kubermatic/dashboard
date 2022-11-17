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
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormArray, FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {InstanceDetailsDialogComponent} from '@app/node-data/basic/provider/kubevirt/instance-details/component';
import {NodeDataService} from '@core/services/node-data/service';
import {ComboboxControls, FilteredComboboxComponent} from '@shared/components/combobox/component';
import {
  KubeVirtNodeAffinityPreset,
  KubeVirtNodeSpec,
  KubeVirtSecondaryDisk,
  NodeCloudSpec,
  NodeSpec,
} from '@shared/entity/node';
import {
  KubeVirtAffinityPreset,
  KubeVirtInstanceType,
  KubeVirtInstanceTypeCategory,
  KubeVirtInstanceTypeKind,
  KubeVirtInstanceTypeList,
  KubeVirtNodeInstanceType,
  KubeVirtNodePreference,
  KubeVirtPreference,
  KubeVirtPreferenceKind,
  KubeVirtPreferenceList,
  KubeVirtStorageClass,
} from '@shared/entity/provider/kubevirt';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {KUBERNETES_RESOURCE_NAME_PATTERN} from '@shared/validators/others';
import _ from 'lodash';
import {Observable} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

enum Controls {
  InstanceType = 'instancetype',
  Preference = 'preference',
  CPUs = 'cpus',
  Memory = 'memory',
  PrimaryDiskOSImage = 'primaryDiskOSImage',
  PrimaryDiskStorageClassName = 'primaryDiskStorageClassName',
  PrimaryDiskSize = 'primaryDiskSize',
  SecondaryDisks = 'secondaryDisks',
  SecondaryDiskStorageClass = 'secondaryDiskStorageClass',
  SecondaryDiskSize = 'secondaryDiskSize',
  PodAffinityPreset = 'podAffinityPreset',
  PodAntiAffinityPreset = 'podAntiAffinityPreset',
  NodeAffinityPreset = 'nodeAffinityPreset',
  NodeAffinityPresetKey = 'nodeAffinityPresetKey',
  NodeAffinityPresetValues = 'nodeAffinityPresetValues',
}

enum InstanceTypeState {
  Ready = 'Instance Type',
  Loading = 'Loading...',
  Empty = 'No Instance Types Available',
}

enum PreferenceState {
  Ready = 'Preference',
  Loading = 'Loading...',
  Empty = 'No Preferences Available',
}

enum StorageClassState {
  Ready = 'Storage Class',
  Loading = 'Loading...',
  Empty = 'No Storage Classes Available',
}

@Component({
  selector: 'km-kubevirt-basic-node-data',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KubeVirtBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => KubeVirtBasicNodeDataComponent),
      multi: true,
    },
  ],
})
export class KubeVirtBasicNodeDataComponent
  extends BaseFormValidator
  implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit
{
  @ViewChild('instanceTypeCombobox')
  private _instanceTypeCombobox: FilteredComboboxComponent;
  @ViewChild('preferenceCombobox')
  private _preferenceCombobox: FilteredComboboxComponent;
  @ViewChild('storageClassCombobox')
  private _storageClassCombobox: FilteredComboboxComponent;
  readonly Controls = Controls;
  readonly maxSecondaryDisks = 3;
  readonly affinityPresetOptions = [KubeVirtAffinityPreset.Hard, KubeVirtAffinityPreset.Soft];
  private readonly _instanceTypeIDSeparator = ':';
  private readonly _defaultCPUs = 2;
  private readonly _defaultMemory = 2048;
  private readonly _initialData = _.cloneDeep(this._nodeDataService.nodeData.spec.cloud.kubevirt);
  private _instanceTypes: KubeVirtInstanceTypeList;
  private _preferences: KubeVirtPreferenceList;
  selectedInstanceType: KubeVirtInstanceType;
  instanceTypeLabel = InstanceTypeState.Empty;
  selectedPreference: KubeVirtPreference;
  preferenceLabel = PreferenceState.Empty;
  storageClasses: KubeVirtStorageClass[] = [];
  selectedStorageClass = '';
  storageClassLabel = StorageClassState.Empty;
  nodeAffinityPresetValues: string[] = [];
  selectedInstanceTypeCpus: string;
  selectedInstanceTypeMemory: string;
  nodeAffinityPresetValuesPattern = KUBERNETES_RESOURCE_NAME_PATTERN;
  nodeAffinityPresetValuesPatternError =
    'Field can only contain <b>alphanumeric characters</b> and <b>dashes</b> (a-z, 0-9 and -). <b>Must not start or end with dash</b>.';

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _matDialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.InstanceType]: this._builder.control(''),
      [Controls.Preference]: this._builder.control(''),
      [Controls.CPUs]: this._builder.control(this._defaultCPUs, Validators.required),
      [Controls.Memory]: this._builder.control(this._defaultMemory, Validators.required),
      [Controls.PrimaryDiskOSImage]: this._builder.control('', Validators.required),
      [Controls.PrimaryDiskStorageClassName]: this._builder.control('', Validators.required),
      [Controls.PrimaryDiskSize]: this._builder.control('10', Validators.required),
      [Controls.SecondaryDisks]: this._builder.array([]),
      [Controls.PodAffinityPreset]: this._builder.control(''),
      [Controls.PodAntiAffinityPreset]: this._builder.control(''),
      [Controls.NodeAffinityPreset]: this._builder.control(''),
      [Controls.NodeAffinityPresetKey]: this._builder.control(''),
      [Controls.NodeAffinityPresetValues]: this._builder.control(''),
    });

    this.form.get(Controls.Preference).disable();
    this.form.get(Controls.NodeAffinityPresetKey).disable();
    this.form.get(Controls.NodeAffinityPresetValues).disable();

    this.form
      .get(Controls.InstanceType)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .pipe(map(value => value[ComboboxControls.Select]))
      .subscribe(value => {
        const preferenceControl = this.form.get(Controls.Preference);
        if (value && preferenceControl.disabled) {
          preferenceControl.enable();
        } else if (!value && preferenceControl.enabled) {
          preferenceControl.reset();
          preferenceControl.disable();
        }
      });

    this.form
      .get(Controls.NodeAffinityPreset)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        if (value) {
          this.form.get(Controls.NodeAffinityPresetKey).enable();
          this.form.get(Controls.NodeAffinityPresetValues).enable();
        } else {
          this.form.get(Controls.NodeAffinityPresetKey).reset();
          this.form.get(Controls.NodeAffinityPresetKey).disable();
          this.form.get(Controls.NodeAffinityPresetValues).reset();
          this.form.get(Controls.NodeAffinityPresetValues).disable();
          this.nodeAffinityPresetValues = [];
        }
      });

    this.form
      .get(Controls.PodAffinityPreset)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        const antiAffinityControl = this.form.get(Controls.PodAntiAffinityPreset);
        if (value && antiAffinityControl.enabled) {
          antiAffinityControl.reset();
          antiAffinityControl.disable();
        } else if (!value && antiAffinityControl.disabled) {
          antiAffinityControl.enable();
        }
      });

    this.form
      .get(Controls.PodAntiAffinityPreset)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(value => {
        const affinityControl = this.form.get(Controls.PodAffinityPreset);
        if (value && affinityControl.enabled) {
          affinityControl.reset();
          affinityControl.disable();
        } else if (!value && affinityControl.disabled) {
          affinityControl.enable();
        }
      });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this.form.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));

    this.form
      .get(Controls.SecondaryDisks)
      .valueChanges.pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => {
        const secondaryDisks = this._secondaryDisks;
        this._nodeDataService.nodeData.spec.cloud.kubevirt.secondaryDisks = secondaryDisks?.length
          ? secondaryDisks
          : null;
      });
  }

  ngAfterViewChecked(): void {
    // Force initial form validation.
    this.form.updateValueAndValidity();
  }

  ngAfterViewInit(): void {
    this._instanceTypesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setInstanceTypes.bind(this));
    this._preferencesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setPreferences.bind(this));

    this._storageClassesObservable
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultStorageClass.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  get instanceTypeCategories(): string[] {
    return Object.keys(this._instanceTypes?.instancetypes || {});
  }

  get preferenceCategories(): string[] {
    return Object.keys(this._preferences?.preferences || {});
  }

  get secondaryDisksFormArray(): FormArray {
    return this.form.get(Controls.SecondaryDisks) as FormArray;
  }

  getInstanceTypeOptions(group: string): KubeVirtInstanceType[] {
    return this._instanceTypes?.instancetypes?.[group] || [];
  }

  instanceTypeDisplayName(instanceTypeId: string): string {
    if (instanceTypeId) {
      // only display name of selected instance type
      return instanceTypeId.substring(instanceTypeId.indexOf(this._instanceTypeIDSeparator) + 1);
    }
    return instanceTypeId;
  }

  getPreferenceOptions(group: string): KubeVirtPreference[] {
    return this._preferences?.preferences?.[group] || [];
  }

  preferenceDisplayName(preferenceId: string): string {
    if (preferenceId) {
      // only display name of selected preference
      return preferenceId.substring(preferenceId.indexOf(this._instanceTypeIDSeparator) + 1);
    }
    return preferenceId;
  }

  addSecondaryDisk(storageClass = '', size = '10'): void {
    this.secondaryDisksFormArray.push(
      this._builder.group({
        [Controls.SecondaryDiskStorageClass]: this._builder.control(storageClass, Validators.required),
        [Controls.SecondaryDiskSize]: this._builder.control(size, Validators.required),
      })
    );
  }

  onInstanceTypeChange(instanceTypeId: string): void {
    if (!instanceTypeId) {
      this.selectedInstanceType = null;
      this._nodeDataService.nodeData.spec.cloud.kubevirt.instancetype = null;
      this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);

      this.selectedInstanceTypeCpus = null;
      this.selectedInstanceTypeMemory = null;
      this.form.get(Controls.CPUs).setValue(this._defaultCPUs);
      this.form.get(Controls.CPUs).setValidators(Validators.required);
      this.form.get(Controls.CPUs).enable();
      this.form.get(Controls.Memory).setValue(this._defaultMemory);
      this.form.get(Controls.Memory).setValidators(Validators.required);
      this.form.get(Controls.Memory).enable();
    } else if (this._instanceTypes) {
      const tokens = instanceTypeId.split(this._instanceTypeIDSeparator);
      const category = tokens.shift();
      const name = tokens.join(this._instanceTypeIDSeparator);
      let kind;
      switch (category) {
        case KubeVirtInstanceTypeCategory.Kubermatic:
          kind = KubeVirtInstanceTypeKind.VirtualMachineInstancetype;
          break;
        case KubeVirtInstanceTypeCategory.Custom:
          kind = KubeVirtInstanceTypeKind.VirtualMachineClusterInstancetype;
          break;
      }
      this.selectedInstanceType = this._instanceTypes?.instancetypes?.[category]?.find(
        instanceType => instanceType.name === name
      );
      this._nodeDataService.nodeData.spec.cloud.kubevirt.instancetype = {
        name,
        kind,
      };
      this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);

      const selectedInstanceTypeSpec = this.selectedInstanceType?.spec;
      try {
        const parsedSpec = JSON.parse(selectedInstanceTypeSpec);
        if (parsedSpec) {
          this.selectedInstanceTypeCpus = parsedSpec.cpu?.guest;
          this.selectedInstanceTypeMemory = parsedSpec.memory?.guest;
        }
        // eslint-disable-next-line no-empty
      } catch (_) {}

      this.form.get(Controls.CPUs).setValue(null);
      this.form.get(Controls.CPUs).setValidators([]);
      this.form.get(Controls.CPUs).disable();
      this.form.get(Controls.Memory).setValue(null);
      this.form.get(Controls.Memory).setValidators([]);
      this.form.get(Controls.Memory).disable();
    }
    this.form.updateValueAndValidity();
  }

  onPreferenceChange(preferenceId: string): void {
    if (!preferenceId) {
      this.selectedPreference = null;
      this._nodeDataService.nodeData.spec.cloud.kubevirt.preference = null;
      this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
    } else if (this._preferences) {
      const tokens = preferenceId.split(this._instanceTypeIDSeparator);
      const category = tokens.shift();
      const name = tokens.join(this._instanceTypeIDSeparator);
      let kind;
      switch (category) {
        case KubeVirtInstanceTypeCategory.Kubermatic:
          kind = KubeVirtPreferenceKind.VirtualMachinePreference;
          break;
        case KubeVirtInstanceTypeCategory.Custom:
          kind = KubeVirtPreferenceKind.VirtualMachineClusterPreference;
          break;
      }
      this.selectedPreference = this._preferences?.preferences?.[category]?.find(
        preference => preference.name === name
      );
      this._nodeDataService.nodeData.spec.cloud.kubevirt.preference = {
        name,
        kind,
      };
      this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
    }
  }

  viewInstanceDetails(): void {
    this._matDialog.open(InstanceDetailsDialogComponent, {
      data: {instanceType: this.selectedInstanceType, preference: this.selectedPreference},
    });
  }

  resetPodAffinityPresetControl(): void {
    this.form.get(Controls.PodAffinityPreset).reset();
  }

  resetPodAntiAffinityPresetControl(): void {
    this.form.get(Controls.PodAntiAffinityPreset).reset();
  }

  resetNodeAffinityPresetControl(): void {
    this.form.get(Controls.NodeAffinityPreset).reset();
  }

  onNodeAffinityPresetValuesChange(values: string[]): void {
    this.nodeAffinityPresetValues = values;
    this._nodeDataService.nodeData.spec.cloud.kubevirt.nodeAffinityPreset.Values = values;
  }

  private get _instanceTypesObservable(): Observable<KubeVirtInstanceTypeList> {
    return this._nodeDataService.kubeVirt
      .instanceTypes(this._clearInstanceType.bind(this), this._onInstanceTypeLoading.bind(this))
      .pipe(
        map(instanceTypes => {
          if (instanceTypes?.instancetypes) {
            Object.keys(instanceTypes.instancetypes).forEach(category => {
              instanceTypes.instancetypes[category] = instanceTypes.instancetypes[category].map(
                (instanceType: KubeVirtInstanceType) => ({
                  _id: `${category}${this._instanceTypeIDSeparator}${instanceType.name}`,
                  ...instanceType,
                })
              );
            });
          }
          return instanceTypes;
        })
      );
  }

  private _clearInstanceType(): void {
    this._instanceTypes = null;
    this.selectedInstanceType = null;
    this.instanceTypeLabel = InstanceTypeState.Empty;
    this._instanceTypeCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onInstanceTypeLoading(): void {
    this.instanceTypeLabel = InstanceTypeState.Loading;
    this._cdr.detectChanges();
  }

  private _setInstanceTypes(instanceTypes: KubeVirtInstanceTypeList): void {
    this._instanceTypes = instanceTypes;
    if (this._initialData?.instancetype) {
      const instanceTypeId = this._getSelectedInstanceTypeId(this._initialData.instancetype);
      this.onInstanceTypeChange(instanceTypeId);
    }
    this.instanceTypeLabel = Object.keys(this._instanceTypes?.instancetypes || {}).some(
      category => this._instanceTypes?.instancetypes?.[category]?.length
    )
      ? InstanceTypeState.Ready
      : InstanceTypeState.Empty;
    this._cdr.detectChanges();
  }

  private get _preferencesObservable(): Observable<KubeVirtPreferenceList> {
    return this._nodeDataService.kubeVirt
      .preferences(this._clearPreference.bind(this), this._onPreferenceLoading.bind(this))
      .pipe(
        map(preferences => {
          if (preferences?.preferences) {
            Object.keys(preferences.preferences).forEach(category => {
              preferences.preferences[category] = preferences.preferences[category].map(
                (preference: KubeVirtPreference) => ({
                  _id: `${category}${this._instanceTypeIDSeparator}${preference.name}`,
                  ...preference,
                })
              );
            });
          }
          return preferences;
        })
      );
  }

  private _clearPreference(): void {
    this._preferences = null;
    this.selectedPreference = null;
    this.preferenceLabel = PreferenceState.Empty;
    this._preferenceCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onPreferenceLoading(): void {
    this.preferenceLabel = PreferenceState.Loading;
    this._cdr.detectChanges();
  }

  private _setPreferences(preferences: KubeVirtPreferenceList): void {
    this._preferences = preferences;
    if (this._initialData?.preference) {
      const preferenceId = this._getSelectedPreferenceId(this._initialData.preference);
      this.onPreferenceChange(preferenceId);
    }
    this.preferenceLabel = Object.keys(this._preferences?.preferences || {}).some(
      category => this._preferences?.preferences?.[category]?.length
    )
      ? PreferenceState.Ready
      : PreferenceState.Empty;
    this._cdr.detectChanges();
  }

  onStorageClassChange(storageClass: string): void {
    this._nodeDataService.nodeData.spec.cloud.kubevirt.primaryDiskStorageClassName = storageClass;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  private get _storageClassesObservable(): Observable<KubeVirtStorageClass[]> {
    return this._nodeDataService.kubeVirt
      .storageClasses(this._clearStorageClass.bind(this), this._onStorageClassLoading.bind(this))
      .pipe(map(storageClasses => _.sortBy(storageClasses, sc => sc.name.toLowerCase())));
  }

  private _clearStorageClass(): void {
    this.storageClasses = [];
    this.selectedStorageClass = '';
    this.storageClassLabel = StorageClassState.Empty;
    this._storageClassCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onStorageClassLoading(): void {
    this.storageClassLabel = StorageClassState.Loading;
    this._cdr.detectChanges();
  }

  private _setDefaultStorageClass(storageClasses: KubeVirtStorageClass[]): void {
    this.storageClasses = storageClasses;
    this.selectedStorageClass = this._initialData?.primaryDiskStorageClassName;

    if (!this.selectedStorageClass && !_.isEmpty(this.storageClasses)) {
      this.selectedStorageClass = this.storageClasses[0].name;
    }

    this.storageClassLabel = this.selectedStorageClass ? StorageClassState.Ready : StorageClassState.Empty;
    this._cdr.detectChanges();
  }

  private _init(): void {
    if (this._initialData) {
      this.form.get(Controls.Memory).setValue(parseInt(this._initialData.memory) || this._defaultMemory);
      this.form.get(Controls.CPUs).setValue(parseInt(this._initialData.cpus) || this._defaultCPUs);
      this.form.get(Controls.PrimaryDiskSize).setValue(this._initialData.primaryDiskSize);
      this.form.get(Controls.PrimaryDiskOSImage).setValue(this._initialData.primaryDiskOSImage);
      this.form.get(Controls.PodAffinityPreset).setValue(this._initialData.podAffinityPreset);
      this.form.get(Controls.PodAntiAffinityPreset).setValue(this._initialData.podAntiAffinityPreset);
      this.form.get(Controls.NodeAffinityPreset).setValue(this._initialData.nodeAffinityPreset?.Type);
      this.form.get(Controls.NodeAffinityPresetKey).setValue(this._initialData.nodeAffinityPreset?.Key);
      this.nodeAffinityPresetValues = this._initialData.nodeAffinityPreset?.Values || [];

      if (this._initialData.instancetype) {
        this.form.get(Controls.InstanceType).setValue(this._getSelectedInstanceTypeId(this._initialData.instancetype));
      }

      if (this._initialData.preference) {
        this.form.get(Controls.Preference).setValue(this._getSelectedPreferenceId(this._initialData.preference));
      }

      if (this._initialData.secondaryDisks?.length) {
        this._initialData.secondaryDisks.forEach(disk => {
          this.addSecondaryDisk(disk.storageClassName, disk.size.match(/\d+/)[0]);
        });
      }
    }
  }

  private _getSelectedInstanceTypeId(instanceType: KubeVirtNodeInstanceType): string {
    let category;
    switch (instanceType.kind) {
      case KubeVirtInstanceTypeKind.VirtualMachineInstancetype:
        category = KubeVirtInstanceTypeCategory.Kubermatic;
        break;
      case KubeVirtInstanceTypeKind.VirtualMachineClusterInstancetype:
        category = KubeVirtInstanceTypeCategory.Custom;
        break;
    }
    return `${category}${this._instanceTypeIDSeparator}${instanceType.name}`;
  }

  private _getSelectedPreferenceId(preference: KubeVirtNodePreference): string {
    let category;
    switch (preference.kind) {
      case KubeVirtPreferenceKind.VirtualMachinePreference:
        category = KubeVirtInstanceTypeCategory.Kubermatic;
        break;
      case KubeVirtPreferenceKind.VirtualMachineClusterPreference:
        category = KubeVirtInstanceTypeCategory.Custom;
        break;
    }
    return `${category}${this._instanceTypeIDSeparator}${preference.name}`;
  }

  private _getNodeData(): NodeData {
    const instanceType = this.form.get(Controls.InstanceType).value[ComboboxControls.Select];
    const cpus = this.form.get(Controls.CPUs).value;
    const memory = this.form.get(Controls.Memory).value;
    const nodeAffinityPreset = this.form.get(Controls.NodeAffinityPreset).value;
    const nodeAffinityPresetData: KubeVirtNodeAffinityPreset = !nodeAffinityPreset
      ? null
      : {
          Type: nodeAffinityPreset,
          Key: this.form.get(Controls.NodeAffinityPresetKey).value,
          Values: this.nodeAffinityPresetValues,
        };

    return {
      spec: {
        cloud: {
          kubevirt: {
            cpus: !instanceType && cpus ? `${cpus}` : null,
            memory: !instanceType && memory ? `${memory}Mi` : null,
            primaryDiskOSImage: this.form.get(Controls.PrimaryDiskOSImage).value,
            primaryDiskStorageClassName: this.form.get(Controls.PrimaryDiskStorageClassName).value[
              ComboboxControls.Select
            ],
            primaryDiskSize: `${this.form.get(Controls.PrimaryDiskSize).value}Gi`,
            podAffinityPreset: this.form.get(Controls.PodAffinityPreset).value,
            podAntiAffinityPreset: this.form.get(Controls.PodAntiAffinityPreset).value,
            nodeAffinityPreset: nodeAffinityPresetData,
          } as KubeVirtNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }

  private get _secondaryDisks(): KubeVirtSecondaryDisk[] {
    return this.secondaryDisksFormArray.controls.map(secondaryDiskFormGroup => {
      return {
        storageClassName: secondaryDiskFormGroup.get(Controls.SecondaryDiskStorageClass).value[ComboboxControls.Select],
        size: `${secondaryDiskFormGroup.get(Controls.SecondaryDiskSize).value}Gi`,
      };
    });
  }
}
