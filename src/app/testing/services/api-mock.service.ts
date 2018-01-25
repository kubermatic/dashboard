import { nodesFake } from './../fake-data/node.fake';
import { NodeEntity } from '../../shared/entity/NodeEntity';
import { SSHKeysFake } from './../fake-data/sshkey.fake';
import { clusterFake, clustersFake } from './../fake-data/cluster.fake';
import { ClusterEntity } from './../../shared/entity/ClusterEntity';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';
import { digitaloceanSizesFake } from '../fake-data/node.fake';
import { CreateNodeModel } from '../../shared/model/CreateNodeModel';

@Injectable()
export class ApiMockService {
    private cluster: ClusterEntity = clusterFake;
    private clusters: ClusterEntity[] = clustersFake;
    private sshKeys: SSHKeyEntity[] = SSHKeysFake;
    private sizes: any = digitaloceanSizesFake;
    private nodes: NodeEntity[] = nodesFake;

    constructor() {
    }

    public getCluster(clusterId: string): Observable<ClusterEntity> {
        return Observable.of(this.cluster);
    }

    public getClusters(): Observable<ClusterEntity[]> {
        return Observable.of(this.clusters);
    }

    public getSSHKeys(): Observable<SSHKeyEntity[]> {
        return Observable.of(this.sshKeys);
    }

    public deleteSSHKey(fingerprint: string): Observable<any> {
        return Observable.of(null);
    }

    public getDigitaloceanSizes(token: string): Observable<any> {
        return Observable.of(this.sizes);
    }

    public createClusterNode(cluster: ClusterEntity, nodeModel: CreateNodeModel): Observable<any> {
        return Observable.of(null);
    }

    public deleteCluster(clusterName: string): Observable<any> {
        return Observable.of(null);
    }

    public deleteClusterNode(clusterName: string, nodeName: string): Observable<any> {
        return Observable.of(null);
    }

    public getClusterNodes(cluster: string): Observable<NodeEntity[]> {
        return Observable.of(this.nodes);
    }

    public getClusterUpgrades(cluster: string): Observable<string[]> {
        return Observable.of([]);
    }

    public updateClusterUpgrade(cluster: string, upgradeVersion: string): void {}

    public addSSHKey(sshKey: SSHKeyEntity): Observable<SSHKeyEntity> {
        return Observable.of(null);
    }
}

