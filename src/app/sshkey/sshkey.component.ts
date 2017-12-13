import {Component, OnInit} from '@angular/core';
import {ApiService} from 'app/core/services/api/api.service';
import {SSHKeyEntity} from '../shared/entity/SSHKeyEntity';
@Component({
  selector: 'kubermatic-sshkey',
  templateUrl: 'sshkey.component.html',
  styleUrls: ['sshkey.component.scss']
})

export class SshkeyComponent implements OnInit {

  public sshKeys: Array<SSHKeyEntity> = [];
  public loading: boolean = true;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.refreshSSHKeys();
  }

  private refreshSSHKeys() {
    this.api.getSSHKeys().retry(3)
      .subscribe(
        result => {
          this.sshKeys = result;
          this.loading = false;
        },
        error => this.loading = false
      );
  }

  public handleKeyUpdated() {
    this.refreshSSHKeys();
  }
}
