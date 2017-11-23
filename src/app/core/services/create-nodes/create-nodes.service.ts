import { NotificationActions } from 'app/redux/actions/notification.actions';
import { Injectable } from '@angular/core';
import { Observable, Subscription } from "rxjs";
import { ApiService } from "../../../api/api.service";
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { CreateNodeModel } from "../../../shared/model/CreateNodeModel";
import { LocalStorageService } from "../local-storage/local-storage.service";

@Injectable()
export class CreateNodesService {
    private timer = Observable.timer(0, 10000);
    private sub: Subscription;
    public hasData: boolean;

    constructor(
        private api: ApiService,
        private localStorageService: LocalStorageService,
        private notificationActions: NotificationActions) {
        let nodesData = this.localStorageService.getNodesData();

        if (nodesData) {
            this.createInitialClusterNodes(nodesData.cluster, nodesData.createNodeModel);
            this.hasData = true;
        }
    }

    public createInitialClusterNodes(cluster: ClusterEntity, createNodeModel: CreateNodeModel): void {

        if (!this.localStorageService.getNodesData()) {
            this.localStorageService.setNodesCreationData({
                cluster: cluster,
                createNodeModel: createNodeModel
            });
            this.hasData = true;
        }

        this.sub = this.timer.subscribe(() => {
            this.api.getCluster(cluster.metadata.name)
                .subscribe(cluster => {
                    if (cluster.status.phase === "Running") {
                        this.api.createClusterNode(cluster, createNodeModel).subscribe(result => {
                            this.preventCreatingInitialClusterNodes();
                            this.notificationActions.success("Success", `Creating Nodes`);
                        });
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
