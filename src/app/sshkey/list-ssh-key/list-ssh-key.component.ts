import { NotificationActions } from 'app/redux/actions/notification.actions';
import {Component, OnInit, Input} from "@angular/core";
import {ApiService} from "../../api/api.service";
import {SSHKeyEntity} from "../../shared/entity/SSHKeyEntity";

@Component({
  selector: 'kubermatic-list-ssh-key',
  templateUrl: './list-ssh-key.component.html',
  styleUrls: ['./list-ssh-key.component.scss']
})
export class ListSshKeyComponent implements OnInit {
  @Input() sshKeys: Array<SSHKeyEntity>;

  constructor(private api: ApiService, private notificationActions: NotificationActions) {}

  ngOnInit() {
  }

  public deleteSSHKey(key: SSHKeyEntity): void {
    this.api.deleteSSHKey(key.metadata.name).subscribe(() => {
      this.sshKeys.splice(this.sshKeys.indexOf(key), 1);
      this.notificationActions.success("Success", `SSH key ${name} deleted.`);
    });
  }

}
