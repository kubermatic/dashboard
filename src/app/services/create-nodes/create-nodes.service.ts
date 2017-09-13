import { Injectable } from '@angular/core';
import { ClusterModel } from '../../api/model/ClusterModel';
import { ApiService } from '../../api/api.service';
import { ClusterEntity } from '../../api/entitiy/ClusterEntity';
import { CreateNodeModel } from "../../api/model/CreateNodeModel";
import { LocalStorageService } from '../local-storage/local-storage.service';
import { Observable, Subscription } from "rxjs";
import {NotificationComponent} from "../../notification/notification.component";
import {Store} from "@ngrx/store";
import * as fromRoot from "../../reducers/index";

@Injectable()
export class CreateNodesService {
    private timer = Observable.timer(0, 10000);

    constructor(
        private api: ApiService, 
        private localStorageService: LocalStorageService,
        private store: Store<fromRoot.State>
    ) {}
 
    public createNodes(cluster: ClusterEntity, createNodeModel: CreateNodeModel): void {
        let sub: Subscription;

        sub = this.timer.subscribe(() => {
            this.api.getCluster(new ClusterModel(cluster.seed, cluster.metadata.name))
                .subscribe(cluster => {
                    if (cluster.status.phase == "Running") {                       
                        this.api.createClusterNode(cluster, createNodeModel).subscribe(result => {
                            sub.unsubscribe();
                            this.localStorageService.removeNodesCreationData();                 
                            NotificationComponent.success(this.store, "Success", `Creating Nodes`);
                        },
                            error => NotificationComponent.error(this.store, "Error", `${error.status} ${error.statusText}`)
                        );
                    }
                },
                error => NotificationComponent.error(this.store, "Error", `${error.status} ${error.statusText}`)             
            );
        })
    }
}