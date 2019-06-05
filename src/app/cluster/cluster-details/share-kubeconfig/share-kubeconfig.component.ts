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

  constructor(
      private readonly _api: ApiService, private readonly _auth: Auth, private readonly _userService: UserService) {}

  ngOnInit(): void {
    if (this._auth.authenticated()) {
      this._userService.loggedInUser.pipe(first()).subscribe((user) => {
        this.userID = user.id;
        this.kubeconfigLink = this._api.getShareKubeconfigURL(
            this.projectID, this.datacenter.metadata.name, this.cluster.id, this.userID);
      });
    }
  }
}
