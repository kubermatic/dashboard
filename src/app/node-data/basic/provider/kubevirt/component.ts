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
import {NodeDataService} from '@core/services/node-data/service';
import {Observable} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {KubeVirtNodeSpec, KubeVirtSecondaryDisk, NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import _ from 'lodash';
import {KubeVirtStorageClass, KubeVirtVMInstancePreset} from '@shared/entity/provider/kubevirt';
import {ComboboxControls, FilteredComboboxComponent} from '@shared/components/combobox/component';
import {MatDialog} from '@angular/material/dialog';
import {FlavorDetailsDialogComponent} from '@app/node-data/basic/provider/kubevirt/flavor-details/component';

enum Controls {
  VMFlavor = 'vmFlavor',
  CPUs = 'cpus',
  Memory = 'memory',
  PrimaryDiskOSImage = 'primaryDiskOSImage',
  PrimaryDiskStorageClassName = 'primaryDiskStorageClassName',
  PrimaryDiskSize = 'primaryDiskSize',
  SecondaryDisks = 'secondaryDisks',
  SecondaryDiskStorageClass = 'secondaryDiskStorageClass',
  SecondaryDiskSize = 'secondaryDiskSize',
}

enum FlavorsState {
  Ready = 'VM Flavor',
  Loading = 'Loading...',
  Empty = 'No VM Flavors Available',
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
  @ViewChild('flavorCombobox')
  private _flavorCombobox: FilteredComboboxComponent;
  @ViewChild('storageClassCombobox')
  private _storageClassCombobox: FilteredComboboxComponent;
  readonly Controls = Controls;
  readonly maxSecondaryDisks = 3;
  private readonly _defaultCPUs = 2;
  private readonly _defaultMemory = 2048;
  private readonly _initialData = _.cloneDeep(this._nodeDataService.nodeData.spec.cloud.kubevirt);
  flavors: KubeVirtVMInstancePreset[] = [];
  selectedFlavor = '';
  flavorLabel = FlavorsState.Empty;
  storageClasses: KubeVirtStorageClass[] = [];
  selectedStorageClass = '';
  storageClassLabel = StorageClassState.Empty;

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
      [Controls.VMFlavor]: this._builder.control(''),
      [Controls.CPUs]: this._builder.control(this._defaultCPUs, Validators.required),
      [Controls.Memory]: this._builder.control(this._defaultMemory, Validators.required),
      [Controls.PrimaryDiskOSImage]: this._builder.control('', Validators.required),
      [Controls.PrimaryDiskStorageClassName]: this._builder.control('', Validators.required),
      [Controls.PrimaryDiskSize]: this._builder.control('10', Validators.required),
      [Controls.SecondaryDisks]: this._builder.array([]),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this.form.valueChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngAfterViewChecked(): void {
    // Force initial form validation.
    this.form.updateValueAndValidity();
  }

  ngAfterViewInit(): void {
    this._flavorsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultFlavor.bind(this));

    this._storageClassesObservable
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultStorageClass.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  get secondaryDisksFormArray(): FormArray {
    return this.form.get(Controls.SecondaryDisks) as FormArray;
  }

  addSecondaryDisk(storageClass = '', size = '10'): void {
    this.secondaryDisksFormArray.push(
      this._builder.group({
        [Controls.SecondaryDiskStorageClass]: this._builder.control(storageClass, Validators.required),
        [Controls.SecondaryDiskSize]: this._builder.control(size, Validators.required),
      })
    );
  }

  onFlavorChange(flavor: string): void {
    this.selectedFlavor = flavor;
    this._nodeDataService.nodeData.spec.cloud.kubevirt.flavorName = flavor;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);

    if (_.isString(flavor) && !_.isEmpty(flavor)) {
      this.form.get(Controls.CPUs).setValue(null);
      this.form.get(Controls.CPUs).setValidators([]);
      this.form.get(Controls.CPUs).disable();
      this.form.get(Controls.Memory).setValue(null);
      this.form.get(Controls.Memory).setValidators([]);
      this.form.get(Controls.Memory).disable();
    } else {
      this.form.get(Controls.CPUs).setValue(this._defaultCPUs);
      this.form.get(Controls.CPUs).setValidators(Validators.required);
      this.form.get(Controls.CPUs).enable();
      this.form.get(Controls.Memory).setValue(this._defaultMemory);
      this.form.get(Controls.Memory).setValidators(Validators.required);
      this.form.get(Controls.Memory).enable();
    }

    this.form.updateValueAndValidity();
  }

  viewFlavor(): void {
    this._matDialog.open(FlavorDetailsDialogComponent, {
      data: {flavor: this.flavors.find(f => f.name === this.selectedFlavor)},
    });
  }

  private get _flavorsObservable(): Observable<KubeVirtVMInstancePreset[]> {
    return this._nodeDataService.kubeVirt
      .vmFlavors(this._clearFlavor.bind(this), this._onFlavorLoading.bind(this))
      .pipe(map(flavors => _.sortBy(flavors, f => f.name.toLowerCase())));
  }

  private _clearFlavor(): void {
    this.flavors = [];
    this.selectedFlavor = '';
    this.flavorLabel = FlavorsState.Empty;
    this._flavorCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onFlavorLoading(): void {
    this._clearFlavor();
    this.flavorLabel = FlavorsState.Loading;
    this._cdr.detectChanges();
  }

  private _setDefaultFlavor(flavors: KubeVirtVMInstancePreset[]): void {
    this.flavors = flavors;
    this.selectedFlavor = this._initialData?.flavorName;
    this.flavorLabel = this.flavors ? FlavorsState.Ready : FlavorsState.Empty;
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
    this._clearStorageClass();
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
    }
  }

  private _getNodeData(): NodeData {
    const flavor = this.form.get(Controls.VMFlavor).value[ComboboxControls.Select];
    const cpus = this.form.get(Controls.CPUs).value;
    const memory = this.form.get(Controls.Memory).value;
    const secondaryDisks = this._secondaryDisks;

    return {
      spec: {
        cloud: {
          kubevirt: {
            flavorName: flavor,
            cpus: !flavor && cpus ? `${cpus}` : null,
            memory: !flavor && memory ? `${memory}Mi` : null,
            primaryDiskOSImage: this.form.get(Controls.PrimaryDiskOSImage).value,
            primaryDiskStorageClassName: this.form.get(Controls.PrimaryDiskStorageClassName).value[
              ComboboxControls.Select
            ],
            primaryDiskSize: `${this.form.get(Controls.PrimaryDiskSize).value}Gi`,
            secondaryDisks: secondaryDisks?.length ? secondaryDisks : null,
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
