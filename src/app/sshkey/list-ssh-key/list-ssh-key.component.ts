import { NotificationActions } from 'app/redux/actions/notification.actions';
import {Component, OnInit, Input} from '@angular/core';
import {ApiService} from 'app/core/services/api/api.service';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';

@Component({
  selector: 'kubermatic-list-ssh-key',
  templateUrl: './list-ssh-key.component.html',
  styleUrls: ['./list-ssh-key.component.scss']
})
export class ListSshKeyComponent implements OnInit {
  @Input() sshKeys: Array<SSHKeyEntity>;

  constructor(private api: ApiService) {}

  ngOnInit() {
  }

  public deleteSSHKey(key: SSHKeyEntity): void {
    this.api.deleteSSHKey(key.metadata.name).subscribe(() => {
      this.sshKeys.splice(this.sshKeys.indexOf(key), 1);
      NotificationActions.success('Success', `SSH key ${name} deleted.`);
    });
  }

}
