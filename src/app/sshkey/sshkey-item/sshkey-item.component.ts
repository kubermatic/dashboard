import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ApiService } from '../../core/services';
import { SSHKeyEntity } from '../../shared/entity/SSHKeyEntity';
import { NotificationActions } from '../../redux/actions/notification.actions';
import { SSHKeyDeleteConfirmationComponent } from '../sshkey-delete-confirmation/sshkey-delete-confirmation.component';

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

  public isShowPublicKey = false;
  public publicKeyName: string;
  public publicKey: string;

  constructor(private apiService: ApiService,
    public dialog: MatDialog,
    private router: Router) { }

  public ngOnInit(): void {
    this.publicKeyName = this.sshKey.spec.publicKey.split(' ')[0];
    this.publicKey = this.sshKey.spec.publicKey.slice(this.publicKeyName.length + 1, -1);
  }

  public getSshKeyItemClass(): string {
    if (this.index % 2 !== 0) {
      return 'odd';
    }
  }

  public deleteSshKey() {
    const modal = this.dialog.open(SSHKeyDeleteConfirmationComponent);
    modal.componentInstance.projectId = this.projectId;
    modal.componentInstance.sshKey = this.sshKey;
    const sub = modal.afterClosed().subscribe(deleted => {
      sub.unsubscribe();
    });
  }

  public togglePublicKey(): void {
    this.isShowPublicKey = !this.isShowPublicKey;
  }
}
