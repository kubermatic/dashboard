import {Component, OnInit, Input} from "@angular/core";
import {ApiService} from "../../api/api.service";
import {SSHKeyEntity} from "../../api/entitiy/SSHKeyEntity";
import {Store} from "@ngrx/store";
import * as fromRoot from "../../reducers/index";
import {NotificationComponent} from "../../notification/notification.component";

@Component({
  selector: 'kubermatic-list-ssh-key',
  templateUrl: './list-ssh-key.component.html',
  styleUrls: ['./list-ssh-key.component.scss']
})
export class ListSshKeyComponent implements OnInit {
  @Input() sshKeys: Array<SSHKeyEntity>;

  constructor(private api: ApiService, private store: Store<fromRoot.State>) {}

  ngOnInit() {
  }

  public deleteSSHKey(key: SSHKeyEntity): void {
    this.api.deleteSSHKey(key.metadata.name).subscribe(() => {
      this.sshKeys.splice(this.sshKeys.indexOf(key), 1);
      NotificationComponent.success(this.store, "Success", `SSH key ${name} deleted.`);
    });
  }

}
