import {Component, Input, OnInit} from '@angular/core';
import {first} from 'rxjs/operators';
import {ApiService, Auth, UserService} from '../../../core/services';
import {ClusterEntity} from '../../../shared/entity/ClusterEntity';
import {DataCenterEntity} from '../../../shared/entity/DatacenterEntity';

@Component({
  selector: 'kubermatic-share-kubeconfig',
  templateUrl: './share-kubeconfig.component.html',
})

export class ShareKubeconfigComponent implements OnInit {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  @Input() projectID: string;
  private userID: string;
  kubeconfigLink: string;

  constructor(private api: ApiService, private auth: Auth, private userService: UserService) {}

  ngOnInit(): void {
    if (this.auth.authenticated()) {
      this.userService.getUser().pipe(first()).subscribe((user) => {
        this.userID = user.id;
        this.kubeconfigLink =
            this.api.getShareKubeconfigURL(this.projectID, this.datacenter.metadata.name, this.cluster.id, this.userID);
      });
    }
  }
}
