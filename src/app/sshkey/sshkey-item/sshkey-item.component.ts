import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material';
import {SSHKeyEntity} from '../../shared/entity/SSHKeyEntity';
import {SSHKeyDeleteConfirmationComponent} from '../sshkey-delete-confirmation/sshkey-delete-confirmation.component';

@Component({
  selector: 'kubermatic-sshkey-item',
  templateUrl: './sshkey-item.component.html',
  styleUrls: ['./sshkey-item.component.scss'],
})

export class SSHKeyItemComponent implements OnInit {
  @Input() index: number;
  @Input() sshKey: SSHKeyEntity;
  @Input() projectId: string;
  @Input() isOdd: boolean;

  isShowPublicKey = false;
  publicKeyName: string;
  publicKey: string;

  constructor(public dialog: MatDialog) {}

  ngOnInit(): void {
    this.publicKeyName = this.sshKey.spec.publicKey.split(' ')[0];
    this.publicKey = this.sshKey.spec.publicKey.slice(this.publicKeyName.length + 1, -1);
  }

  getSshKeyItemClass(): string {
    if (this.index % 2 !== 0) {
      return 'km-odd';
    }
  }

  deleteSshKey(): void {
    const modal = this.dialog.open(SSHKeyDeleteConfirmationComponent);
    modal.componentInstance.projectId = this.projectId;
    modal.componentInstance.sshKey = this.sshKey;
    const sub = modal.afterClosed().subscribe(() => {
      sub.unsubscribe();
    });
  }

  togglePublicKey(): void {
    this.isShowPublicKey = !this.isShowPublicKey;
  }
}
