import { AddSshKeyModalComponent } from '../shared/components/add-ssh-key-modal/add-ssh-key-modal.component';
import { Component, OnInit } from '@angular/core';
import { ApiService } from '../core/services/api/api.service';
import { SSHKeyEntity } from '../shared/entity/SSHKeyEntity';
import { MatDialog, MatDialogConfig } from '@angular/material';

@Component({
  selector: 'kubermatic-sshkey',
  templateUrl: 'sshkey.component.html',
  styleUrls: ['sshkey.component.scss']
})

export class SshkeyComponent implements OnInit {

  public sshKeys: Array<SSHKeyEntity> = [];
  public loading = true;
  public config: MatDialogConfig = {};

  constructor(private api: ApiService,
              public dialog: MatDialog) {}

  public ngOnInit(): void {
    //this.refreshSSHKeys();
  }

 /* public addSshKeyDialog(): void {
    const dialogRef = this.dialog.open(AddSshKeyModalComponent, this.config);

    dialogRef.afterClosed().subscribe(result => {
      result && this.refreshSSHKeys();
    });
  }

  private refreshSSHKeys(): void {
    this.api.getSSHKeys().retry(3)
      .subscribe(
        result => {
          this.sshKeys = result;
          this.loading = false;
        },
        error => this.loading = false
      );
  }*/
}
