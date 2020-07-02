import {Component, Input, OnInit} from '@angular/core';
import {first} from 'rxjs/operators';
import {ApiService, Auth, UserService} from '../../../core/services';
import {Cluster} from '../../../shared/entity/cluster';
import {Datacenter} from '../../../shared/entity/datacenter';

@Component({
  selector: 'km-share-kubeconfig',
  templateUrl: './share-kubeconfig.component.html',
  styleUrls: ['./share-kubeconfig.component.scss'],
})
export class ShareKubeconfigComponent implements OnInit {
  @Input() cluster: Cluster;
  @Input() datacenter: Datacenter;
  @Input() projectID: string;
  private userID: string;
  kubeconfigLink: string;

  constructor(
    private readonly _api: ApiService,
    private readonly _auth: Auth,
    private readonly _userService: UserService
  ) {}

  ngOnInit(): void {
    if (this._auth.authenticated()) {
      this._userService.loggedInUser.pipe(first()).subscribe(user => {
        this.userID = user.id;
        this.kubeconfigLink = this._api.getShareKubeconfigURL(
          this.projectID,
          this.datacenter.metadata.name,
          this.cluster.id,
          this.userID
        );
      });
    }
  }
}
