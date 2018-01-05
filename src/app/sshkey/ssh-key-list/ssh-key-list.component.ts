import { NotificationActions } from 'app/redux/actions/notification.actions';
import {Component, OnInit, Input} from '@angular/core';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';

@Component({
  selector: 'kubermatic-ssh-key-list',
  templateUrl: './ssh-key-list.component.html',
  styleUrls: ['./ssh-key-list.component.scss']
})
export class SshKeyListComponent {
  @Input() sshKeys: Array<SSHKeyEntity>;

  constructor() {}

  public deleteSSHKey(key: SSHKeyEntity): void {
    this.sshKeys.splice(this.sshKeys.indexOf(key), 1);
    NotificationActions.success('Success', `SSH key ${name} deleted.`);
  }

}
