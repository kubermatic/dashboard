import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {switchMap, takeUntil} from 'rxjs/operators';
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
import {ClusterUtils} from '../../../shared/utils/cluster-utils/cluster-utils';

@Component({
  selector: 'km-wizard-summary-step',
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
    private readonly _clusterService: ClusterService,
    private readonly _nodeDataService: NodeDataService,
    private readonly _datacenterService: DatacenterService
  ) {}

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
    return this._clusterService.provider;
  }

  ngOnInit(): void {
    this.nodeData = this._nodeDataService.nodeData;
    this.cluster = this._clusterService.cluster;
    this._clusterService.sshKeyChanges
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(keys => (this.clusterSSHKeys = keys));

    this._clusterService.datacenterChanges
      .pipe(switchMap(dc => this._datacenterService.getDataCenter(dc)))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(dc => {
        this._location = dc.spec.location;
        this._country = dc.spec.country;
      });

    if (this.cluster.spec.machineNetworks) {
      this.noMoreIpsLeft = this._noIpsLeft(this.cluster, this.nodeData.count);
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

  getClusterType(): string {
    return ClusterUtils.getClusterType(this.cluster);
  }

  displayProvider(): boolean {
    return (
      Object.values(NodeProvider)
        .filter(
          p => p !== NodeProvider.BAREMETAL && p !== NodeProvider.BRINGYOUROWN
        )
        .some(p => this._hasProviderOptions(p)) ||
      this._clusterService.provider === NodeProvider.BRINGYOUROWN
    );
  }

  displayTags(tags: object): boolean {
    return (
      !!tags &&
      Object.keys(LabelFormComponent.filterNullifiedKeys(tags)).length > 0
    );
  }

  displayNoProviderTags(): boolean {
    const provider = this._clusterService.provider;
    switch (provider) {
      case NodeProvider.AWS:
      case NodeProvider.OPENSTACK:
      case NodeProvider.AZURE:
        return !this.displayTags(this.nodeData.spec.cloud[provider].tags);
      case NodeProvider.ALIBABA:
        return !this.displayTags(this.nodeData.spec.cloud[provider].labels);
      case NodeProvider.DIGITALOCEAN:
      case NodeProvider.GCP:
      case NodeProvider.PACKET:
        return (
          this.nodeData.spec.cloud[provider] &&
          this.nodeData.spec.cloud[provider].tags &&
          this.nodeData.spec.cloud[provider].tags.length === 0
        );
    }

    return false;
  }

  getDnsServers(dnsServers: string[]): string {
    return dnsServers.join(', ');
  }

  getSSHKeyNames(): string {
    return this.clusterSSHKeys.map(key => key.name).join(', ');
  }

  private _hasProviderOptions(provider: NodeProvider): boolean {
    return (
      this._clusterService.provider === provider &&
      this.cluster.spec.cloud[provider] &&
      Object.values(this.cluster.spec.cloud[provider]).some(val => val)
    );
  }

  private _noIpsLeft(cluster: ClusterEntity, nodeCount: number): boolean {
    const ipCount = getIpCount(cluster.spec.machineNetworks);

    if (!!ipCount && ipCount > 0) {
      return !(ipCount - nodeCount >= 0);
    } else {
      return false;
    }
  }
}
