import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {DatacenterService} from '../../../core/services';
import {NodeDataService} from '../../../node-data-new/service/service';
import {LabelFormComponent} from '../../../shared/components/label-form/label-form.component';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {SSHKeyEntity} from '../../../shared/entity/SSHKeyEntity';
import {getIpCount} from '../../../shared/functions/get-ip-count';
import {NodeProvider} from '../../../shared/model/NodeProviderConstants';
import {NodeData} from '../../../shared/model/NodeSpecChange';
import {NodeUtils} from '../../../shared/utils/node-utils/node-utils';
import {ClusterService} from '../../service/cluster';
import {WizardService} from '../../service/wizard';

@Component({
  selector: 'kubermatic-wizard-summary-step',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class SummaryStepComponent implements OnInit, OnDestroy {
  clusterSSHKeys: SSHKeyEntity[] = [];
  nodeData: NodeData;
  cluster: ClusterEntity;
  noMoreIpsLeft = false;

  private _location: string;
  private _country: string;
  private _unsubscribe = new Subject<void>();

  constructor(
      private readonly _wizardService: WizardService, private readonly _clusterService: ClusterService,
      private readonly _nodeDataService: NodeDataService, private readonly _datacenterService: DatacenterService) {}

  get country(): string {
    return this._country;
  }

  get location(): string {
    return this._location;
  }

  get datacenter(): string {
    return this.cluster.spec.cloud.dc;
  }

  get provider(): NodeProvider {
    return this._wizardService.provider;
  }

  ngOnInit(): void {
    this.nodeData = this._nodeDataService.nodeData;
    this.cluster = this._clusterService.cluster;

    this._datacenterService.getDataCenter(this.datacenter).pipe(takeUntil(this._unsubscribe)).subscribe(dc => {
      this._location = dc.spec.location;
      this._country = dc.spec.country;
    });

    if (!!this.cluster.spec.machineNetworks) {
      this.noMoreIpsLeft = this.noIpsLeft(this.cluster, this.nodeData.count);
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  getOperatingSystem(): string {
    return NodeUtils.getOperatingSystem(this.nodeData.spec);
  }

  getOperatingSystemLogoClass(): string {
    return NodeUtils.getOperatingSystemLogoClass(this.nodeData.spec);
  }

  displayProvider(): boolean {
    return !!this.cluster.spec.cloud.digitalocean || !!this.cluster.spec.cloud.hetzner ||
        !!this.cluster.spec.cloud.bringyourown || (!!this.cluster.spec.cloud.aws && !this.hasAWSProviderOptions()) ||
        (!!this.cluster.spec.cloud.gcp && !this.hasGCPProviderOptions()) ||
        (!!this.cluster.spec.cloud.azure && !this.hasAzureProviderOptions());
  }

  hasAWSProviderOptions(): boolean {
    return this.cluster.spec.cloud.aws.securityGroupID !== '' || this.cluster.spec.cloud.aws.vpcId !== '' ||
        this.cluster.spec.cloud.aws.vpcId !== '' || this.cluster.spec.cloud.aws.routeTableId !== '' ||
        this.cluster.spec.cloud.aws.instanceProfileName !== '' || this.cluster.spec.cloud.aws.roleARN !== '';
  }

  hasGCPProviderOptions(): boolean {
    return this.cluster.spec.cloud.gcp.network !== '' || this.cluster.spec.cloud.gcp.subnetwork !== '';
  }

  hasAzureProviderOptions(): boolean {
    return this.cluster.spec.cloud.azure.resourceGroup !== '' || this.cluster.spec.cloud.azure.routeTable !== '' ||
        this.cluster.spec.cloud.azure.securityGroup !== '' || this.cluster.spec.cloud.azure.subnet !== '' ||
        this.cluster.spec.cloud.azure.vnet !== '';
  }

  displayTags(tags: object): boolean {
    return !!tags && Object.keys(LabelFormComponent.filterNullifiedKeys(tags)).length > 0;
  }

  displayNoProviderTags(): boolean {
    if (this.nodeData.spec.cloud.aws) {
      return !this.displayTags(this.nodeData.spec.cloud.aws.tags);
    } else if (this.nodeData.spec.cloud.digitalocean) {
      return this.nodeData.spec.cloud.digitalocean.tags.length === 0;
    } else if (this.nodeData.spec.cloud.gcp) {
      return this.nodeData.spec.cloud.gcp.tags.length === 0;
    } else if (this.nodeData.spec.cloud.packet) {
      return this.nodeData.spec.cloud.packet.tags.length === 0;
    } else if (this.nodeData.spec.cloud.openstack) {
      return !this.displayTags(this.nodeData.spec.cloud.openstack.tags);
    } else if (this.nodeData.spec.cloud.azure) {
      return !this.displayTags(this.nodeData.spec.cloud.azure.tags);
    } else {
      return false;
    }
  }

  getDnsServers(dnsServers: string[]): string {
    return dnsServers.join(', ');
  }

  getSSHKeyNames(): string {
    return this.clusterSSHKeys.map(key => key.name).join(', ');
  }

  noIpsLeft(cluster: ClusterEntity, nodeCount: number): boolean {
    const ipCount = getIpCount(cluster.spec.machineNetworks);

    if (!!ipCount && ipCount > 0) {
      return !((ipCount - nodeCount) >= 0);
    } else {
      return false;
    }
  }
}
