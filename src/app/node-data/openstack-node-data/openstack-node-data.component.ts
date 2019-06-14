import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {iif, Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ApiService, DatacenterService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {OpenstackFlavor} from '../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {NodeProvider} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-openstack-node-data',
  styleUrls: ['./openstack-node-data.component.scss'],
  templateUrl: './openstack-node-data.component.html',
})
export class OpenstackNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() projectId: string;
  @Input() clusterId: string;
  @Input() seedDCName: string;

  flavors: OpenstackFlavor[] = [];
  loadingFlavors = false;
  osNodeForm: FormGroup;
  loadingSizes = false;
  private _unsubscribe = new Subject<void>();

  constructor(
      private readonly _addNodeService: NodeDataService, private readonly _api: ApiService,
      private readonly _dcService: DatacenterService, private readonly _wizard: WizardService) {}

  ngOnInit(): void {
    this.osNodeForm = new FormGroup({
      flavor: new FormControl(this.nodeData.spec.cloud.openstack.flavor, Validators.required),
      useFloatingIP: new FormControl(this.nodeData.spec.cloud.openstack.useFloatingIP),
    });

    this.osNodeForm.valueChanges.pipe(takeUntil(this._unsubscribe)).subscribe(() => {
      this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    });

    this._addNodeService.changeNodeProviderData(this.getNodeProviderData());
    this.loadFlavors();
    this.checkFlavorState();

    this._dcService.getDataCenter(this.cloudSpec.dc).pipe(takeUntil(this._unsubscribe)).subscribe((dc) => {
      if (dc.spec.openstack.enforce_floating_ip) {
        this.osNodeForm.controls.useFloatingIP.setValue(true);
        this.osNodeForm.controls.useFloatingIP.disable();
        return;
      }

      if (!this.isInWizard() && !this.cloudSpec.openstack.floatingIpPool) {
        this.osNodeForm.controls.useFloatingIP.setValue(false);
        this.osNodeForm.controls.useFloatingIP.disable();
      }
    });

    this._wizard.clusterProviderSettingsFormChanges$.pipe(takeUntil(this._unsubscribe)).subscribe((data) => {
      if (data.cloudSpec.openstack.username === this.cloudSpec.openstack.username &&
          data.cloudSpec.openstack.password === this.cloudSpec.openstack.password &&
          data.cloudSpec.openstack.domain === this.cloudSpec.openstack.domain &&
          data.cloudSpec.openstack.tenant === this.cloudSpec.openstack.tenant) {
        return;
      }

      this.cloudSpec = data.cloudSpec;
      this.osNodeForm.controls.flavor.setValue('');
      this.flavors = [];
      this.checkFlavorState();
      if (data.cloudSpec.openstack.username !== '' || data.cloudSpec.openstack.password !== '' ||
          data.cloudSpec.openstack.domain !== '' || data.cloudSpec.openstack.tenant !== '') {
        this.loadFlavors();
      }
    });
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        openstack: {
          flavor: this.osNodeForm.controls.flavor.value,
          image: this.nodeData.spec.cloud.openstack.image,
          useFloatingIP: this.osNodeForm.controls.useFloatingIP.value,
          tags: this.nodeData.spec.cloud.openstack.tags,
        },
      },
      valid: this.osNodeForm.valid,
    };
  }

  checkFlavorState(): void {
    if (this.flavors.length === 0) {
      this.osNodeForm.controls.flavor.disable();
    } else {
      this.osNodeForm.controls.flavor.enable();
    }
  }

  showFlavorHint(): boolean {
    return (!this.loadingFlavors && !this.hasCredentials()) && this.isInWizard();
  }

  getFlavorsFormState(): string {
    if ((!this.loadingFlavors && !this.hasCredentials()) && this.isInWizard()) {
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

  hasCredentials(): boolean {
    return !!this.cloudSpec.openstack.username && this.cloudSpec.openstack.username.length > 0 &&
        !!this.cloudSpec.openstack.password && this.cloudSpec.openstack.password.length > 0 &&
        !!this.cloudSpec.openstack.tenant && this.cloudSpec.openstack.tenant.length > 0 &&
        !!this.cloudSpec.openstack.domain && this.cloudSpec.openstack.domain.length > 0;
  }

  private handleFlavours(flavors: OpenstackFlavor[]): void {
    const sortedFlavors = flavors.sort((a, b) => {
      return (a.memory < b.memory ? -1 : 1) * ('asc' ? 1 : -1);
    });
    this.flavors = sortedFlavors;
    if (sortedFlavors.length > 0 && this.osNodeForm.controls.flavor.value !== '0' &&
        this.nodeData.spec.cloud.openstack.flavor === '') {
      this.osNodeForm.controls.flavor.setValue(this.flavors[0].slug);
    }
    this.loadingFlavors = false;
  }

  loadFlavors(): void {
    this.loadingFlavors = true;
    iif(() => this.isInWizard(),
        this._wizard.provider(NodeProvider.OPENSTACK)
            .username(this.cloudSpec.openstack.username)
            .password(this.cloudSpec.openstack.password)
            .tenant(this.cloudSpec.openstack.tenant)
            .domain(this.cloudSpec.openstack.domain)
            .datacenter(this.cloudSpec.dc)
            .flavors(),
        this._api.getOpenStackFlavors(this.projectId, this.seedDCName, this.clusterId))
        .pipe(takeUntil(this._unsubscribe))
        .subscribe((flavors) => {
          this.handleFlavours(flavors);
          this.checkFlavorState();
          this.loadingFlavors = false;
        }, () => this.loadingSizes = false);
  }

  isFloatingIPEnforced(): boolean {
    return this.osNodeForm.controls.useFloatingIP.disabled;
  }
}
