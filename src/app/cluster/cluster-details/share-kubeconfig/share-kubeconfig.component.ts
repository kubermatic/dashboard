import {Component, Input, OnInit} from '@angular/core';
import {first} from 'rxjs/operators';
import {ApiService, Auth, UserService} from '../../../core/services';
import {Cluster} from '../../../shared/entity/cluster';

@Component({
  selector: 'km-share-kubeconfig',
  templateUrl: './share-kubeconfig.component.html',
  styleUrls: ['./share-kubeconfig.component.scss'],
})
export class ShareKubeconfigComponent implements OnInit {
  @Input() cluster: Cluster;
  @Input() seed: string;
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
        this.kubeconfigLink = this._api.getShareKubeconfigURL(this.projectID, this.seed, this.cluster.id, this.userID);
      });
    }
  }
}
