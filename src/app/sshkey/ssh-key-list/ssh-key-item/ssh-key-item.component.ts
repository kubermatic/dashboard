import { SSHKeyEntity } from 'app/shared/entity/SSHKeyEntity';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ApiService } from 'app/core/services/api/api.service';

@Component({
  selector: 'kubermatic-ssh-key-item',
  templateUrl: './ssh-key-item.component.html',
  styleUrls: ['./ssh-key-item.component.scss']
})
export class SshKeyItemComponent implements OnInit {
  @Input() sshKey: SSHKeyEntity;
  @Output() deleteSshKey: EventEmitter<SSHKeyEntity> = new EventEmitter();
  public isShowPublicKey: boolean = false;

  constructor(private api: ApiService) { }

  ngOnInit() {
    console.log(this.sshKey);
  }

  public deleteSSHKey(key: SSHKeyEntity, event: any): void {
    event.preventDefault();

    this.api.deleteSSHKey(key.metadata.name).subscribe(() => {
      // this.sshKeys.splice(this.sshKeys.indexOf(key), 1);
      this.deleteSshKey.emit(key);
      // NotificationActions.success('Success', `SSH key ${name} deleted.`);
    });
  }

  public togglePublicKey(): void {
    this.isShowPublicKey = !this.isShowPublicKey;
  }

}
