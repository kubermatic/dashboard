import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ClusterEntity } from '../../../shared/entity/ClusterEntity';
import { WizardService } from '../../../core/services/wizard/wizard.service';
import { SSHKeyEntity } from '../../../shared/entity/SSHKeyEntity';
import { ApiService } from '../../../core/services';
import { Subscription } from 'rxjs/Subscription';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { AddSshKeyModalComponent } from '../../../shared/components/add-ssh-key-modal/add-ssh-key-modal.component';

@Component({
  selector: 'kubermatic-cluster-ssh-keys',
  templateUrl: './cluster-ssh-keys.component.html',
  styleUrls: ['./cluster-ssh-keys.component.scss']
})
export class ClusterSSHKeysComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() selectedKeys: SSHKeyEntity[] = [];
  public keys: SSHKeyEntity[] = [];
  public keysForm: FormGroup = new FormGroup({
    keys: new FormControl([], []),
  });
  private keysSub: Subscription;
  private keysFormSub: Subscription;

  constructor(private api: ApiService,
              private wizardService: WizardService,
              private dialog: MatDialog) { }

  ngOnInit() {
    const keyNames: string[] = [];
    for (const key of this.selectedKeys) {
      keyNames.push(key.name);
    }
    this.keysForm.controls.keys.patchValue(keyNames);

    this.keysFormSub = this.keysForm.valueChanges.subscribe(data => {
      const clusterKeys: SSHKeyEntity[] = [];
      for (const selectedKey of this.keysForm.controls.keys.value) {
        for (const key of this.keys) {
          if (selectedKey === key.name) {
            clusterKeys.push(key);
          }
        }
      }
      this.wizardService.changeClusterSSHKeys(clusterKeys);
    });

    this.reloadKeys();
  }

  ngOnDestroy() {
    this.keysSub.unsubscribe();
    this.keysFormSub.unsubscribe();
  }

  reloadKeys() {
    this.keysSub = this.api.getSSHKeys('7d4r7tqmww').subscribe(sshKeys => {
      this.keys = sshKeys.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
    });
  }

  public addSshKeyDialog(): void {
    const dialogRef = this.dialog.open(AddSshKeyModalComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.keysSub) {
          this.keysSub.unsubscribe();
        }

        this.reloadKeys();

        this.keysForm.setValue({
          keys: [result.metadata.name]
        });
      }
    });
  }
}
