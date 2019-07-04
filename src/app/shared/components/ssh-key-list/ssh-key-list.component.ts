import {Component, Input} from '@angular/core';
import {SSHKeyEntity} from '../../entity/SSHKeyEntity';

@Component({
  selector: 'km-ssh-key-list',
  templateUrl: './ssh-key-list.component.html',
  styleUrls: ['./ssh-key-list.component.scss'],
})
export class SSHKeyListComponent {
  @Input() sshKeys: SSHKeyEntity[] = [];
  @Input() maxDisplayed = 3;

  getDisplayed(): string {
    return this.sshKeys.slice(0, this.maxDisplayed).map(key => key.name).join(', ');
  }

  getTruncatedSSHKeys(): string {
    return this.sshKeys.slice(this.maxDisplayed).map(key => key.name).join(', ');
  }
}
