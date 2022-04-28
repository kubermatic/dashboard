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

import {AfterViewChecked, Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {NodeDataService} from '@core/services/node-data/service';
import {merge} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {NodeCloudSpec, NodeSpec} from '@shared/entity/node';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';

enum Controls {
  CPUs = 'cpus',
  Memory = 'memory',
  Namespace = 'namespace',
  SourceURL = 'sourceURL',
  StorageClassName = 'storageClassName',
  PVCSize = 'pvcSize',
}

@Component({
  selector: 'km-kubevirt-basic-node-data',
  templateUrl: './template.html',
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
export class KubeVirtBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy, AfterViewChecked {
  private readonly _memorySizePattern = /^([0-9.]+)(Gi|Mi)$/;

  readonly Controls = Controls;

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.CPUs]: this._builder.control('1', Validators.required),
      [Controls.Memory]: this._builder.control('2Gi', [
        Validators.required,
        Validators.pattern(this._memorySizePattern),
      ]),
      [Controls.Namespace]: this._builder.control('kube-system', Validators.required),
      [Controls.SourceURL]: this._builder.control('', Validators.required),
      [Controls.StorageClassName]: this._builder.control('', Validators.required),
      [Controls.PVCSize]: this._builder.control('10Gi', [
        Validators.required,
        Validators.pattern(this._memorySizePattern),
      ]),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    merge(
      this.form.get(Controls.CPUs).valueChanges,
      this.form.get(Controls.Memory).valueChanges,
      this.form.get(Controls.Namespace).valueChanges,
      this.form.get(Controls.SourceURL).valueChanges,
      this.form.get(Controls.StorageClassName).valueChanges,
      this.form.get(Controls.PVCSize).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngAfterViewChecked(): void {
    // Force initial form validation.
    this.form.updateValueAndValidity();
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
    if (this._nodeDataService.nodeData.spec.cloud.kubevirt) {
      this.form.get(Controls.Namespace).setValue(this._nodeDataService.nodeData.spec.cloud.kubevirt.namespace);
      this.form.get(Controls.PVCSize).setValue(this._nodeDataService.nodeData.spec.cloud.kubevirt.pvcSize);
      this.form
        .get(Controls.StorageClassName)
        .setValue(this._nodeDataService.nodeData.spec.cloud.kubevirt.storageClassName);
      this.form.get(Controls.SourceURL).setValue(this._nodeDataService.nodeData.spec.cloud.kubevirt.sourceURL);
      this.form.get(Controls.Memory).setValue(this._nodeDataService.nodeData.spec.cloud.kubevirt.memory);
      this.form.get(Controls.CPUs).setValue(this._nodeDataService.nodeData.spec.cloud.kubevirt.cpus);
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
