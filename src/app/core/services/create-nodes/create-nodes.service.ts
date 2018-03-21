import { NotificationActions } from 'app/redux/actions/notification.actions';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { ApiService } from 'app/core/services/api/api.service';
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
        private localStorageService: LocalStorageService) {
        const nodesData = this.localStorageService.getNodesData();

        if (nodesData) {
            this.createInitialClusterNodes(nodesData.nodeCount, nodesData.cluster, nodesData.createNodeModel);
            this.hasData = true;
        }
    }

    public createInitialClusterNodes(nodeCount: number, cluster: ClusterEntity, createNodeModel: CreateNodeModel): void {

        if (!this.localStorageService.getNodesData()) {
            this.localStorageService.setNodesCreationData([{
                nodeCount: nodeCount,
                cluster: cluster,
                createNodeModel: createNodeModel
            }]);
            this.localStorageService.setNodeCountData(cluster.metadata.name, 0);

            this.hasData = true;
        } else {
            if (nodeCount) {
              const onWaiting = this.localStorageService.getNodesData();
              onWaiting.push({
                nodeCount: nodeCount,
                cluster: cluster,
                createNodeModel: createNodeModel
              });
              this.localStorageService.setNodeCountData(cluster.metadata.name, 0);
              this.localStorageService.setNodesCreationData(onWaiting);
            }
        }

        this.sub = this.timer.subscribe(() => {
            const createNodePipline = this.localStorageService.getNodesData();
            if (createNodePipline && createNodePipline.length) {
                for (let i = 0; i < createNodePipline.length; i ++) {
                    if (!!createNodePipline[i] && !!createNodePipline[i].nodeCount) {
                        this.api.getCluster(createNodePipline[i].cluster.metadata.name).subscribe(curCluster => {
                            if (curCluster.status.phase === 'Running') {
                                let currentNodeCount = this.localStorageService.getNodeCountData(createNodePipline[i].cluster.metadata.name);
                                if (currentNodeCount !== createNodePipline[i].nodeCount) {
                                    this.api.createClusterNode(curCluster, createNodePipline[i].createNodeModel).subscribe(result => {
                                    }, error => {
                                        this.removeCreateNodesLocalStorage(i, createNodePipline[i].cluster.metadata.name);
                                        NotificationActions.error('Error', `${error.status} ${error.statusText}`);
                                        return;
                                    }, () => {
                                        currentNodeCount = this.localStorageService.getNodeCountData(createNodePipline[i].cluster.metadata.name) + 1;
                                        this.localStorageService.setNodeCountData(createNodePipline[i].cluster.metadata.name, currentNodeCount);

                                        if ( currentNodeCount === createNodePipline[i].nodeCount ) {
                                            NotificationActions.success('Success', `Creating Nodes`);
                                            this.removeCreateNodesLocalStorage(i, createNodePipline[i].cluster.metadata.name);
                                        }
                                    });
                                } else {
                                  this.removeCreateNodesLocalStorage(i, createNodePipline[i].cluster.metadata.name);
                                }
                            }
                        });
                    }
                }
            }
        });
    }

    public removeCreateNodesLocalStorage(key, clusterName) {
      const nodePipline = this.localStorageService.getNodesData();

      this.localStorageService.removeNodeCountData(clusterName);
      if (nodePipline.length === 1) {
        this.localStorageService.removeNodesCreationData();
      } else {
        nodePipline.splice(key, 1);
        this.localStorageService.setNodesCreationData(nodePipline);
      }
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
