import { NotificationActions } from 'app/redux/actions/notification.actions';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { ApiService } from './../../services/api/api.service';
import { DatacenterService } from './../../services/datacenter/datacenter.service';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { CreateNodeModel } from '../../../shared/model/CreateNodeModel';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable()
export class CreateNodesService {
    private timer = Observable.timer(0, 10000);
    private sub: Subscription;
    public hasData: boolean;

    constructor(
        private api: ApiService,
        private dcService: DatacenterService,
        private localStorageService: LocalStorageService) {
        const nodesData = this.localStorageService.getNodesData();

        if (nodesData) {
            this.dcService.getDataCenter(nodesData.cluster.spec.cloud.dc).subscribe(res => {
                this.createInitialClusterNodes(nodesData.nodeCount, nodesData.cluster, nodesData.createNodeModel, res.spec.seed);
                this.hasData = true;
            });
        }
    }

    public createInitialClusterNodes(nodeCount: number, cluster: ClusterEntity, createNodeModel: CreateNodeModel, datacenter: string): void {
        if (!this.localStorageService.getNodesData()) {
            this.localStorageService.setNodesCreationData({
                nodeCount: nodeCount,
                cluster: cluster,
                createNodeModel: createNodeModel,
                datacenter: datacenter
            });
            this.hasData = true;
        }

        this.sub = this.timer.subscribe(() => {
            this.api.getCluster(cluster.metadata.name, datacenter)
                .subscribe(curCluster => {
                    if (curCluster.status.phase === 'Running') {
                        let successCounter: number = 0;
                        for (let i = 0; i < nodeCount; i ++) {
                            this.api.createClusterNode(curCluster, createNodeModel, datacenter).subscribe(result => {
                                this.preventCreatingInitialClusterNodes();
                                successCounter++;
                                if (successCounter === nodeCount) {
                                    NotificationActions.success('Success', `Creating Nodes`);
                                }
                            });
                        }
                    }
                });
        });
    }

    public preventCreatingInitialClusterNodes(): void {
        if (this.sub) {
            this.sub.unsubscribe();
            this.localStorageService.removeNodesCreationData();
            this.sub = null;
            this.hasData = false;
        }
    }
}
