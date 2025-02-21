// Copyright 2024 The Kubermatic Kubernetes Platform contributors.
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
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {NodeDataService} from '@core/services/node-data/service';
import {ComboboxControls, FilteredComboboxComponent} from '@shared/components/combobox/component';
import {
  BaremetalNodeSpec,
  BaremetalTinkerbellHardwareRef,
  BaremetalTinkerbellNodeSpec,
  NodeCloudSpec,
  NodeSpec,
} from '@shared/entity/node';
import {TinkerbellOSImage, TinkerbellOSImageList} from '@shared/entity/provider/baremetal';
import {NodeProviderConstants, OperatingSystem} from '@shared/model/NodeProviderConstants';
import {NodeData} from '@shared/model/NodeSpecChange';
import {BaseFormValidator} from '@shared/validators/base-form.validator';
import {merge, Observable} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

enum Controls {
  OSImage = 'osImage',
  HardwareReferenceName = 'hardwareReferenceName',
  HardwareReferenceNamespace = 'hardwareReferenceNamespace',
}

class OSImageState {
  static Loading = 'Loading...';

  static Ready(os?: OperatingSystem) {
    return `${this._getOSMessage(os)} System Image`;
  }

  static Empty(os?: OperatingSystem) {
    return `No ${this._getOSMessage(os)} System Images Available`;
  }

  private static _getOSMessage(os?: OperatingSystem): string {
    return os ? NodeProviderConstants.getOperatingSystemDisplayName(os) : 'Operating';
  }
}

class OSImageDropdownOption {
  version: string;
  link: string;
}

@Component({
    selector: 'km-baremetal-basic-node-data',
    templateUrl: './template.html',
    styleUrls: ['./style.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => BaremetalBasicNodeDataComponent),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => BaremetalBasicNodeDataComponent),
            multi: true,
        },
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class BaremetalBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;
  @ViewChild('osImageCombobox') private _osImageCombobox: FilteredComboboxComponent;

  osImageDropdownOptions: OSImageDropdownOption[];
  selectedOSImage: TinkerbellOSImage;
  osImageLabel: string = OSImageState.Empty();
  selectedOS: OperatingSystem;

  private _osImages: TinkerbellOSImageList;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _nodeDataService: NodeDataService
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.OSImage]: this._builder.control('', Validators.required),
      [Controls.HardwareReferenceName]: this._builder.control('', Validators.required),
      [Controls.HardwareReferenceNamespace]: this._builder.control('', Validators.required),
    });

    this._init();
    this._nodeDataService.nodeData = this._getNodeData();

    this._osImagesObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setOSImages.bind(this));

    this._nodeDataService.operatingSystemChanges.pipe(takeUntil(this._unsubscribe)).subscribe(operatingSystem => {
      this.selectedOS = operatingSystem;
      this._setOSImageDropdownOptions();
      this._setOSImageLabel();
    });

    merge(
      this.form.get(Controls.HardwareReferenceName).valueChanges,
      this.form.get(Controls.HardwareReferenceNamespace).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  osImageDisplayName(osImageLink: string): string {
    const osImage = this.osImageDropdownOptions?.find(image => image.link === osImageLink);
    return osImage ? `${osImage.version} - ${osImage.link}` : osImageLink;
  }

  onOSImageChange(osImageLink: string): void {
    this._nodeDataService.nodeData.spec.cloud.baremetal.tinkerbell.osImageUrl = osImageLink;
    this._nodeDataService.nodeDataChanges.next(this._nodeDataService.nodeData);
  }

  private _init(): void {
    const tinkerbellSpec = this._nodeDataService.nodeData.spec.cloud.baremetal?.tinkerbell;
    if (tinkerbellSpec) {
      this.form.get(Controls.HardwareReferenceName).setValue(tinkerbellSpec.hardwareRef?.Name);
      this.form.get(Controls.HardwareReferenceNamespace).setValue(tinkerbellSpec.hardwareRef?.Namespace);
      this.form.get(Controls.OSImage).setValue(tinkerbellSpec.osImageUrl);

      this._cdr.detectChanges();
    }
  }

  private get _osImagesObservable(): Observable<TinkerbellOSImageList> {
    return this._nodeDataService.baremetal.osImages(this._clearOSImage.bind(this), this._onOSImagesLoading.bind(this));
  }

  private _clearOSImage(): void {
    this._osImages = null;
    this.selectedOSImage = null;
    this.osImageLabel = OSImageState.Empty(this.selectedOS);
    this._osImageCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onOSImagesLoading(): void {
    this.osImageLabel = OSImageState.Loading;
    this._cdr.detectChanges();
  }

  private _setOSImages(osImages: TinkerbellOSImageList): void {
    this._osImages = osImages;
    this._setOSImageDropdownOptions();
    this._setOSImageLabel();
    this._cdr.detectChanges();
  }

  private _setOSImageDropdownOptions(): void {
    if (!this.selectedOS) {
      this.osImageDropdownOptions = [];
    }
    const osVersions = this._osImages?.standard?.operatingSystems?.[this.selectedOS];
    this.osImageDropdownOptions = osVersions
      ? Object.keys(osVersions).map(version => ({
          version,
          link: osVersions[version],
        }))
      : [];
    const selectedOSImage = this.form.get(Controls.OSImage).value?.[ComboboxControls?.Select];
    if (selectedOSImage && !this.osImageDropdownOptions.find(osImage => osImage.link === selectedOSImage)) {
      this._osImageCombobox.reset();
    }
  }

  private _setOSImageLabel(): void {
    this.osImageLabel = this.osImageDropdownOptions?.length
      ? OSImageState.Ready(this.selectedOS)
      : OSImageState.Empty(this.selectedOS);
    this._cdr.detectChanges();
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          baremetal: {
            tinkerbell: {
              hardwareRef: {
                Name: this.form.get(Controls.HardwareReferenceName).value,
                Namespace: this.form.get(Controls.HardwareReferenceNamespace).value,
              } as BaremetalTinkerbellHardwareRef,
            } as BaremetalTinkerbellNodeSpec,
          } as BaremetalNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
