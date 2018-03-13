import { NotificationActions } from 'app/redux/actions/notification.actions';
import {Component, OnInit, Input, OnChanges} from '@angular/core';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {Sort} from '@angular/material';

@Component({
  selector: 'kubermatic-ssh-key-list',
  templateUrl: './ssh-key-list.component.html',
  styleUrls: ['./ssh-key-list.component.scss']
})
export class SshKeyListComponent implements OnInit, OnChanges {
  @Input() sshKeys: Array<SSHKeyEntity>;
  public sortedData: Array<SSHKeyEntity>;

  ngOnInit() {
    this.sortData({active: 'name', direction: 'asc'});
  }

  ngOnChanges() {
    this.sortData({active: 'name', direction: 'asc'});
  }

  sortData(sort: Sort) {
    if (this.sshKeys) {
      const data = this.sshKeys.slice();
      if (sort === null || !sort.active || sort.direction === '') {
        this.sortedData = data;
        return;
      }

      this.sortedData = data.sort((a, b) => {
        const isAsc = sort.direction === 'asc';
        switch (sort.active) {
          case 'name': return this.compare(a.spec.name, b.spec.name, isAsc);
          case 'fingerprint': return this.compare(a.spec.fingerprint, b.spec.fingerprint, isAsc);

          default: return 0;
        }
      });
    }
  }

  compare(a, b, isAsc) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  public deleteSSHKey(key: SSHKeyEntity): void {
    this.sortedData.splice(this.sortedData.indexOf(key), 1);
    NotificationActions.success('Success', `SSH key ${key.spec.name} deleted.`);
  }

}
