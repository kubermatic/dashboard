import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {ApiService, DatacenterService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {OpenstackFlavor} from '../../shared/entity/provider/openstack/OpenstackSizeEntity';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-openstack-node-data',
  styleUrls: ['./openstack-node-data.component.scss'],
  templateUrl: './openstack-node-data.component.html',
})
export class OpenstackNodeDataComponent implements OnInit, OnDestroy, OnChanges {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;
  @Input() projectId: string;
  @Input() clusterId: string;
  @Input() seedDCName: string;

  flavors: OpenstackFlavor[] = [];
  loadingFlavors = false;
  osNodeForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private addNodeService: NodeDataService, private api: ApiService, private dcService: DatacenterService) {}

  ngOnInit(): void {
    this.osNodeForm = new FormGroup({
      flavor: new FormControl(this.nodeData.spec.cloud.openstack.flavor, Validators.required),
      useFloatingIP: new FormControl(this.nodeData.spec.cloud.openstack.useFloatingIP),
    });

    this.subscriptions.push(this.osNodeForm.valueChanges.subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    this.loadFlavors();
    this.checkFlavorState();

    this.subscriptions.push(this.dcService.getDataCenter(this.cloudSpec.dc).subscribe((dc) => {
      if (dc.spec.openstack.enforce_floating_ip) {
        this.osNodeForm.controls.useFloatingIP.setValue(true);
        this.osNodeForm.controls.useFloatingIP.disable();
        return;
      }

      if (!this.cloudSpec.openstack.floatingIpPool) {
        this.osNodeForm.controls.useFloatingIP.setValue(false);
        this.osNodeForm.controls.useFloatingIP.disable();
      }
    }));
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!!changes.cloudSpec) {
      this.loadFlavors();
    }
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

  getFlavorsFormState(): string {
    if (!this.loadingFlavors && this.isInWizard() && !this.hasCredentials()) {
      return 'Please enter your credentials first!';
    } else if (this.loadingFlavors) {
      return 'Loading flavors...';
    } else {
      return 'Flavor*:';
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
    if (sortedFlavors.length > 0 && this.osNodeForm.controls.flavor.value !== '0') {
      this.osNodeForm.controls.flavor.setValue(this.nodeData.spec.cloud.openstack.flavor);
    }
    this.loadingFlavors = false;
  }

  loadFlavors(): void {
    if (this.isInWizard()) {
      if (!this.hasCredentials()) {
        return;
      }
      this.loadingFlavors = true;
      this.subscriptions.push(this.api
                                  .getOpenStackFlavorsForWizard(
                                      this.cloudSpec.openstack.username, this.cloudSpec.openstack.password,
                                      this.cloudSpec.openstack.tenant, this.cloudSpec.openstack.domain,
                                      this.cloudSpec.dc)
                                  .subscribe((flavors) => {
                                    this.handleFlavours(flavors);
                                    this.checkFlavorState();
                                  }));
    } else {
      this.loadingFlavors = true;
      this.subscriptions.push(
          this.api.getOpenStackFlavors(this.projectId, this.seedDCName, this.clusterId).subscribe((flavors) => {
            this.handleFlavours(flavors);
            this.checkFlavorState();
          }));
    }
  }

  isFloatingIPEnforced(): boolean {
    return this.osNodeForm.controls.useFloatingIP.disabled;
  }
}
