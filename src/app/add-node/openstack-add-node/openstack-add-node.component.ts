import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { CloudSpec } from '../../shared/entity/ClusterEntity';
import { OpenstackFlavor } from '../../shared/entity/provider/openstack/OpenstackSizeEntity';
import { NodeData, NodeProviderData } from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-openstack-add-node',
  templateUrl: './openstack-add-node.component.html',
  styleUrls: ['./openstack-add-node.component.scss'],
})
export class OpenstackAddNodeComponent implements OnInit, OnDestroy, OnChanges {
  @Input() public cloudSpec: CloudSpec;
  @Input() public nodeData: NodeData;
  @Input() public projectId: string;
  @Input() public clusterId: string;
  @Input() public seedDCName: string;

  public flavors: OpenstackFlavor[] = [];
  public loadingFlavors = false;
  public osNodeForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private addNodeService: AddNodeService, private api: ApiService) { }

  ngOnInit(): void {
    this.osNodeForm = new FormGroup({
      flavor: new FormControl(this.nodeData.node.spec.cloud.openstack.flavor, Validators.required),
    });
    this.subscriptions.push(this.osNodeForm.valueChanges.subscribe(() => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    this.loadFlavors();
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
          image: this.nodeData.node.spec.cloud.openstack.image,
        },
      },
      valid: this.osNodeForm.valid,
    };
  }

  isInWizard(): boolean {
    return !this.clusterId || this.clusterId.length === 0;
  }

  public hasCredentials(): boolean {
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
      this.osNodeForm.controls.flavor.setValue(this.nodeData.node.spec.cloud.openstack.flavor);
    }
    this.loadingFlavors = false;
  }

  public loadFlavors(): void {
    if (this.isInWizard()) {
      if (!this.hasCredentials()) {
        return;
      }
      this.loadingFlavors = true;
      this.subscriptions.push(this.api.getOpenStackFlavorsForWizard(this.cloudSpec.openstack.username,
        this.cloudSpec.openstack.password, this.cloudSpec.openstack.tenant, this.cloudSpec.openstack.domain,
        this.cloudSpec.dc).subscribe((flavors) => this.handleFlavours(flavors)));
    } else {
      this.loadingFlavors = true;
      this.subscriptions.push(this.api.getOpenStackFlavors(this.projectId, this.seedDCName, this.clusterId)
        .subscribe((flavors) => this.handleFlavours(flavors)));
    }
  }
}
