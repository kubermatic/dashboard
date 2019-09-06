import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {iif, Subject} from 'rxjs';
import {take, takeUntil} from 'rxjs/operators';
import {ApiService, DatacenterService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {OperatingSystemSpec} from '../../shared/entity/NodeEntity';
import {OpenstackFlavor} from '../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-openstack-node-data',
  styleUrls: ['./openstack-node-data.component.scss'],
  templateUrl: './openstack-node-data.component.html',
})
export class OpenstackNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec = {openstack: {}} as CloudSpec;
  @Input() nodeData: NodeData;
  @Input() projectId: string;
  @Input() clusterId: string;
  @Input() seedDCName: string;

  flavors: OpenstackFlavor[] = [];
  loadingFlavors = false;
  form: FormGroup;

  private _unsubscribe = new Subject<void>();
  private _selectedPreset: string;

  constructor(
      private readonly _addNodeService: NodeDataService, private readonly _api: ApiService,
      private readonly _dcService: DatacenterService, private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      flavor: new FormControl(this.nodeData.spec.cloud.openstack.flavor, Validators.required),
      useFloatingIP: new FormControl(this.nodeData.spec.cloud.openstack.useFloatingIP),
      disk_size: new FormControl(
          this.nodeData.spec.cloud.openstack.diskSize > 0 ? this.nodeData.spec.cloud.openstack.diskSize : ''),
      customDiskSize: new FormControl(this.nodeData.spec.cloud.openstack.diskSize > 0),
      image: new FormControl(this.nodeData.spec.cloud.openstack.image),
    });

    this.form.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this._getNodeProviderData());
    });

    this._addNodeService.changeNodeProviderData(this._getNodeProviderData());
    this._loadFlavors();
    this.checkFlavorState();

    if (this.nodeData.spec.cloud.openstack.image === '') {
      this.setImage(this.nodeData.spec.operatingSystem);
    }

    this._addNodeService.nodeOperatingSystemDataChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if ((!!this.nodeData.spec.operatingSystem.ubuntu && !data.ubuntu) ||
          (!!this.nodeData.spec.operatingSystem.centos && !data.centos) ||
          (!!this.nodeData.spec.operatingSystem.containerLinux && !data.containerLinux)) {
        this.setImage(data);
      }
      this._addNodeService.changeNodeProviderData(this._getNodeProviderData());
    });

    this._dcService.getDataCenter(this.cloudSpec.dc).pipe(takeUntil(this._unsubscribe)).subscribe((dc) => {
      if (dc.spec.openstack.enforce_floating_ip) {
        this.form.controls.useFloatingIP.setValue(true);
        this.form.controls.useFloatingIP.disable();
        return;
      }

      if (!this.isInWizard() && !this.cloudSpec.openstack.floatingIpPool) {
        this.form.controls.useFloatingIP.setValue(false);
        this.form.controls.useFloatingIP.disable();
      }
    });

    this._wizard.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      let credentialsChanged = false;
      if (this._hasCredentialsChanged(this.cloudSpec, data.cloudSpec)) {
        this.form.controls.flavor.setValue('');
        this.flavors = [];
        this.checkFlavorState();
        credentialsChanged = true;
      }

      this.cloudSpec = data.cloudSpec;

      if (this._hasCredentials() && credentialsChanged) {
        this._loadFlavors();
      }
    });

    this._wizard.onCustomPresetSelect.pipe(takeUntil(this._unsubscribe)).subscribe(preset => {
      if (preset) {
        this._selectedPreset = preset;
        this._loadFlavors();
        return;
      }

      this.flavors = [];
      this._selectedPreset = '';
      this.checkFlavorState();
    });
  }

  setImage(operatingSystem: OperatingSystemSpec): void {
    this._dcService.getDataCenter(this.cloudSpec.dc).subscribe((res) => {
      let coreosImage = '';
      let centosImage = '';
      let ubuntuImage = '';

      for (const i in res.spec.openstack.images) {
        if (i === 'coreos') {
          coreosImage = res.spec.openstack.images[i];
        } else if (i === 'centos') {
          centosImage = res.spec.openstack.images[i];
        } else if (i === 'ubuntu') {
          ubuntuImage = res.spec.openstack.images[i];
        }
      }

      if (operatingSystem.ubuntu) {
        return this.form.controls.image.setValue(ubuntuImage);
      } else if (operatingSystem.centos) {
        return this.form.controls.image.setValue(centosImage);
      } else if (operatingSystem.containerLinux) {
        return this.form.controls.image.setValue(coreosImage);
      }
    });
  }

  checkFlavorState(): void {
    if (this.flavors.length === 0) {
      this.form.controls.flavor.disable();
      this.form.controls.customDiskSize.disable();
    } else {
      this.form.controls.flavor.enable();
      this.form.controls.customDiskSize.enable();
    }
  }

  showFlavorHint(): boolean {
    return (!this.loadingFlavors && !this._hasCredentials() && !this._selectedPreset) && this.isInWizard();
  }

  getFlavorsFormState(): string {
    if ((!this.loadingFlavors && !this._hasCredentials()) && this.isInWizard()) {
      return 'Flavor*';
    } else if (this.loadingFlavors) {
      return 'Loading flavors...';
    } else if (!this.loadingFlavors && this.flavors.length === 0) {
      return 'No Flavors available';
    } else {
      return 'Flavor*';
    }
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  isFloatingIPEnforced(): boolean {
    return this.form.controls.useFloatingIP.disabled;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  private _getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        openstack: {
          flavor: this.form.controls.flavor.value,
          image: this.form.controls.image.value,
          useFloatingIP: this.form.controls.useFloatingIP.value,
          tags: this.nodeData.spec.cloud.openstack.tags,
          diskSize: this._getCurrentFlavor() && this.form.controls.disk_size.value > 0 &&
                  this.form.controls.disk_size.value !== this._getCurrentFlavor().disk ?
              this.form.controls.disk_size.value :
              null,
        },
      },
      valid: this.form.valid,
    };
  }

  private _hasCredentials(): boolean {
    return !!this.cloudSpec.openstack.username && this.cloudSpec.openstack.username.length > 0 &&
        !!this.cloudSpec.openstack.password && this.cloudSpec.openstack.password.length > 0 &&
        !!this.cloudSpec.openstack.domain && this.cloudSpec.openstack.domain.length > 0 &&
        ((!!this.cloudSpec.openstack.tenant && this.cloudSpec.openstack.tenant.length > 0) ||
         (!!this.cloudSpec.openstack.tenantID && this.cloudSpec.openstack.tenantID.length > 0));
  }

  private _hasCredentialsChanged(prev: CloudSpec, curr: CloudSpec): boolean {
    return prev.openstack.username !== curr.openstack.username || prev.openstack.password !== curr.openstack.password ||
        prev.openstack.domain !== curr.openstack.domain || prev.openstack.tenant !== curr.openstack.tenant ||
        prev.openstack.tenantID !== curr.openstack.tenantID;
  }

  private _handleFlavours(flavors: OpenstackFlavor[]): void {
    const sortedFlavors = flavors.sort((a, b) => {
      return (a.memory < b.memory ? -1 : 1) * ('asc' ? 1 : -1);
    });
    this.flavors = sortedFlavors;
    if (sortedFlavors.length > 0 && this.form.controls.flavor.value !== '0' &&
        this.nodeData.spec.cloud.openstack.flavor === '') {
      this.form.controls.flavor.setValue(this.flavors[0].slug);
    }
    this.loadingFlavors = false;
  }

  private _loadFlavors(): void {
    if (!this._hasCredentials() && !this._selectedPreset) {
      return;
    }

    this.loadingFlavors = !this.isInWizard() || this._hasCredentials() || !!this._selectedPreset;

    iif(() => this.isInWizard(),
        this._wizard.provider(NodeProvider.OPENSTACK)
            .username(this.cloudSpec.openstack.username)
            .password(this.cloudSpec.openstack.password)
            .tenant(this.cloudSpec.openstack.tenant)
            .tenantID(this.cloudSpec.openstack.tenantID)
            .domain(this.cloudSpec.openstack.domain)
            .credential(this._selectedPreset)
            .datacenter(this.cloudSpec.dc)
            .flavors(),
        this._api.getOpenStackFlavors(this.projectId, this.seedDCName, this.clusterId))
        .pipe(take(1))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((flavors) => {
          this._handleFlavours(flavors);
          this.checkFlavorState();
          this.loadingFlavors = false;
        }, () => this.loadingFlavors = false);
  }

  private _getCurrentFlavor(): OpenstackFlavor {
    for (const flavor of this.flavors) {
      if (flavor.slug === this.nodeData.spec.cloud.openstack.flavor) {
        return flavor;
      }
    }
  }
}
