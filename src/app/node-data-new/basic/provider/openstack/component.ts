import {Component, forwardRef, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge, Observable} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';

import {DataCenterEntity} from '../../../../shared/entity/DatacenterEntity';
import {OpenstackNodeSpec} from '../../../../shared/entity/node/OpenstackNodeSpec';
import {NodeCloudSpec, NodeSpec} from '../../../../shared/entity/NodeEntity';
import {OpenstackFlavor} from '../../../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {OperatingSystem} from '../../../../shared/model/NodeProviderConstants';
import {NodeData} from '../../../../shared/model/NodeSpecChange';
import {BaseFormValidator} from '../../../../shared/validators/base-form.validator';
import {NodeDataService} from '../../../service/service';

enum Controls {
  Flavor = 'flavor',
  UseFloatingIP = 'useFloatingIP',
  DiskSize = 'diskSize',
  CustomDiskSize = 'customDiskSize',
  Image = 'image',
}

@Component({
  selector: 'km-openstack-basic-node-data',
  styleUrls: ['./style.scss'],
  templateUrl: './template.html',
  providers: [
    {provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => OpenstackBasicNodeDataComponent), multi: true},
    {provide: NG_VALIDATORS, useExisting: forwardRef(() => OpenstackBasicNodeDataComponent), multi: true}
  ],
})
export class OpenstackBasicNodeDataComponent extends BaseFormValidator implements OnInit, OnDestroy {
  readonly Controls = Controls;

  flavors: OpenstackFlavor[] = [];
  selectedFlavor = '';

  constructor(private readonly _builder: FormBuilder, private readonly _nodeDataService: NodeDataService) {
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
    this._flavorsObservable.pipe(takeUntil(this._unsubscribe)).subscribe(this._setDefaultFlavor.bind(this));
    this._setDefaultImage();

    merge(
        this.form.get(Controls.DiskSize).valueChanges,
        this.form.get(Controls.Image).valueChanges,
        this.form.get(Controls.UseFloatingIP).valueChanges,
        )
        .pipe(takeUntil(this._unsubscribe))
        .subscribe(_ => this._nodeDataService.nodeData = this._getNodeData());
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
    return flavor ? `${flavor.slug} - ${flavor.memory / 1024} GB RAM, ${flavor.vcpus} CPU${
                        (flavor.vcpus !== 1) ? 's' : ''}, ${flavor.disk} GB Disk` :
                    '';
  }

  private get _flavorsObservable(): Observable<OpenstackFlavor[]> {
    return this._nodeDataService.openstack.flavors(this._clearFlavor.bind(this))
        .pipe(map((flavors: OpenstackFlavor[]) => flavors.sort((a, b) => {
          return (a.memory < b.memory ? -1 : 1) * ('asc' ? 1 : -1);
        })));
  }

  private _clearFlavor(): void {
    this.flavors = [];
    this.selectedFlavor = '';
  }

  private _setDefaultFlavor(flavors: OpenstackFlavor[]): void {
    this.flavors = flavors;
    if (this.flavors.length > 0) {
      this.selectedFlavor = this.flavors[0].slug;
    }
  }

  private _setDefaultImage(): void {
    this._nodeDataService.openstack.dc().pipe(takeUntil(this._unsubscribe)).subscribe((dc: DataCenterEntity) => {
      let coreosImage = '';
      let centosImage = '';
      let ubuntuImage = '';

      for (const i in dc.spec.openstack.images) {
        if (i === 'coreos') {
          coreosImage = dc.spec.openstack.images[i];
        } else if (i === 'centos') {
          centosImage = dc.spec.openstack.images[i];
        } else if (i === 'ubuntu') {
          ubuntuImage = dc.spec.openstack.images[i];
        }
      }

      if (this._nodeDataService.operatingSystem === OperatingSystem.Ubuntu) {
        return this.form.get(Controls.Image).setValue(ubuntuImage);
      } else if (this._nodeDataService.operatingSystem === OperatingSystem.CentOS) {
        return this.form.get(Controls.Image).setValue(centosImage);
      } else if (this._nodeDataService.operatingSystem === OperatingSystem.ContainerLinux) {
        return this.form.get(Controls.Image).setValue(coreosImage);
      }
    });
  }

  private _getCurrentFlavor(): OpenstackFlavor {
    for (const flavor of this.flavors) {
      if (flavor.slug === this._nodeDataService.nodeData.spec.cloud.openstack.flavor) {
        return flavor;
      }
    }
  }

  private _setDiskSize(): number {
    return this._getCurrentFlavor() && this.form.get(Controls.DiskSize).value > 0 &&
            this.form.get(Controls.DiskSize).value !== this._getCurrentFlavor().disk ?
        this.form.get(Controls.DiskSize).value :
        null;
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
