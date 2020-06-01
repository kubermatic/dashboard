import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  forwardRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge, Observable} from 'rxjs';
import {delay, filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {DatacenterService} from '../../../../core/services';
import {FilteredComboboxComponent} from '../../../../shared/components/combobox/component';
import {ClusterType} from '../../../../shared/entity/ClusterEntity';

import {DatacenterOperatingSystemOptions} from '../../../../shared/entity/DatacenterEntity';
import {OpenstackNodeSpec} from '../../../../shared/entity/node/OpenstackNodeSpec';
import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {OpenstackFlavor} from '../../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {OperatingSystem} from '../../../../shared/model/NodeProviderConstants';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {ClusterService} from '../../../../wizard-new/service/cluster';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Flavor = 'flavor',
  UseFloatingIP = 'useFloatingIP',
  DiskSize = 'diskSize',
  CustomDiskSize = 'customDiskSize',
  Image = 'image',
}

enum FlavorState {
  Ready = 'Flavor',
  Loading = 'Loading...',
  Empty = 'No Flavors Available',
}

@Component({
  selector: 'km-openstack-basic-node-data',
  styleUrls: ['./style.scss'],
  templateUrl: './template.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OpenstackBasicNodeDataComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => OpenstackBasicNodeDataComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenstackBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy, AfterViewInit {
  private _defaultImage = '';
  private _images: DatacenterOperatingSystemOptions;

  @ViewChild('flavorCombobox')
  private readonly _flavorCombobox: FilteredComboboxComponent;

  readonly Controls = Controls;

  flavors: OpenstackFlavor[] = [];
  selectedFlavor = '';
  flavorsLabel = FlavorState.Empty;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _nodeDataService: NodeDataService,
    private readonly _clusterService: ClusterService,
    private readonly _datacenterService: DatacenterService,
    private readonly _cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Flavor]: this._builder.control('', Validators.required),
      [Controls.UseFloatingIP]: this._builder.control(''),
      [Controls.DiskSize]: this._builder.control(''),
      [Controls.CustomDiskSize]: this._builder.control(''),
      [Controls.Image]: this._builder.control('', Validators.required),
    });

    this._nodeDataService.nodeData = this._getNodeData();

    this._clusterService.datacenterChanges
      .pipe(switchMap(dc => this._datacenterService.getDatacenter(dc)))
      .pipe(tap(dc => (this._images = dc.spec.openstack.images)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(dc => {
        this._setDefaultImage(OperatingSystem.Ubuntu);
        this._enforceFloatingIP(dc.spec.openstack.enforce_floating_ip);
      });

    this._clusterService.clusterTypeChanges
      .pipe(filter(_ => !!this._images))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ =>
        this._isOpenshiftCluster()
          ? this._setDefaultImage(OperatingSystem.CentOS)
          : this._setDefaultImage(OperatingSystem.Ubuntu)
      );

    this._nodeDataService.operatingSystemChanges
      .pipe(filter(_ => !!this._images))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(this._setDefaultImage.bind(this));

    merge(
      this.form.get(Controls.DiskSize).valueChanges,
      this.form.get(Controls.Image).valueChanges,
      this.form.get(Controls.UseFloatingIP).valueChanges
    )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(_ => (this._nodeDataService.nodeData = this._getNodeData()));
  }

  ngAfterViewInit() {
    this._flavorsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultFlavor.bind(this));
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isFloatingIPEnforced(): boolean {
    return this.form.get(Controls.UseFloatingIP).disabled;
  }

  onFlavorChange(flavor: string): void {
    this._nodeDataService.nodeData.spec.cloud.openstack.flavor = flavor;
  }

  flavorDisplayName(slug: string): string {
    const flavor = this.flavors.find(flavor => flavor.slug === slug);
    return flavor
      ? `${flavor.slug} - ${flavor.memory / 1024} GB RAM, ${flavor.vcpus} CPU${flavor.vcpus !== 1 ? 's' : ''}, ${
          flavor.disk
        } GB Disk`
      : '';
  }

  private _isOpenshiftCluster(): boolean {
    return this._clusterService.clusterType === ClusterType.OpenShift;
  }

  private get _flavorsObservable(): Observable<OpenstackFlavor[]> {
    return this._nodeDataService.openstack
      .flavors(this._clearFlavor.bind(this), this._onFlavorLoading.bind(this))
      .pipe(delay(3000))
      .pipe(map((flavors: OpenstackFlavor[]) => flavors.sort((a, b) => (a.memory < b.memory ? -1 : 1))));
  }

  private _clearFlavor(): void {
    this.flavors = [];
    this.selectedFlavor = '';
    this.flavorsLabel = FlavorState.Empty;
    this._flavorCombobox.reset();
    this._cdr.detectChanges();
  }

  private _onFlavorLoading(): void {
    this._clearFlavor();
    this.flavorsLabel = FlavorState.Loading;
    this._cdr.detectChanges();
  }

  private _setDefaultFlavor(flavors: OpenstackFlavor[]): void {
    this.flavors = flavors;
    this.flavorsLabel = this.flavors.length > 0 ? FlavorState.Ready : FlavorState.Empty;
    if (this.flavors.length > 0) {
      this.selectedFlavor = this.flavors[0].slug;
    }

    this._cdr.detectChanges();
  }

  private _setDefaultImage(os: OperatingSystem): void {
    switch (os) {
      case OperatingSystem.CentOS:
        this._defaultImage = this._images.centos;
        break;
      case OperatingSystem.Ubuntu:
        this._defaultImage = this._images.ubuntu;
        break;
      case OperatingSystem.SLES:
        this._defaultImage = this._images.sles;
        break;
      case OperatingSystem.ContainerLinux:
        this._defaultImage = this._images.coreos;
        break;
      default:
        this._defaultImage = this._images.ubuntu;
    }

    this.form.get(Controls.Image).setValue(this._defaultImage);
  }

  private _enforceFloatingIP(isEnforced: boolean): void {
    if (isEnforced) {
      this.form.get(Controls.UseFloatingIP).setValue(true);
      this.form.get(Controls.UseFloatingIP).disable();
      return;
    }

    if (!this._clusterService.cluster.spec.cloud.openstack.floatingIpPool) {
      this.form.get(Controls.UseFloatingIP).setValue(false);
      this.form.get(Controls.UseFloatingIP).disable();
    }
  }

  private _getCurrentFlavor(): OpenstackFlavor {
    for (const flavor of this.flavors) {
      if (flavor.slug === this._nodeDataService.nodeData.spec.cloud.openstack.flavor) {
        return flavor;
      }
    }
  }

  private _setDiskSize(): number {
    return this._getCurrentFlavor() &&
      this.form.get(Controls.DiskSize).value > 0 &&
      this.form.get(Controls.DiskSize).value !== this._getCurrentFlavor().disk
      ? this.form.get(Controls.DiskSize).value
      : null;
  }

  private _getNodeData(): NodeData {
    return {
      spec: {
        cloud: {
          openstack: {
            image: this.form.get(Controls.Image).value,
            useFloatingIP: this.form.get(Controls.UseFloatingIP).value,
            diskSize: this._setDiskSize(),
          } as OpenstackNodeSpec,
        } as NodeCloudSpec,
      } as NodeSpec,
    } as NodeData;
  }
}
