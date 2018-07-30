import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../../../redux/actions/notification.actions';
import { ApiService, ProjectService } from '../../../../core/services';
import { DataCenterEntity } from '../../../../shared/entity/DatacenterEntity';
import { ClusterEntity } from '../../../../shared/entity/ClusterEntity';
import { ProjectEntity } from '../../../../shared/entity/ProjectEntity';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-revoke-admin-token',
  templateUrl: './revoke-admin-token.component.html',
  styleUrls: ['./revoke-admin-token.component.scss']
})

export class RevokeAdminTokenComponent implements OnInit, OnDestroy {
  @Input() cluster: ClusterEntity;
  @Input() datacenter: DataCenterEntity;
  public generatedToken: string;
  public adminToken = '';
  public project: ProjectEntity;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private projectService: ProjectService,
              private dialogRef: MatDialogRef<RevokeAdminTokenComponent>) {}

  ngOnInit() {
    this.projectService.selectedProjectChanges$.subscribe(project => {
      this.project = project;
    });

    this.subscriptions.push(this.projectService.selectedProjectChanges$.subscribe(project => {
      this.project = project;
    }));

    /* do {
      this.generatedToken = this.generate(6) + '.' + this.generate(16);
    } while (this.generatedToken === this.cluster.address.adminToken);
    this.adminToken = this.generatedToken;*/
  }

  public generate(length: number): string {
    let token = '';
    let randomValue;
    const possible = 'bcdfghjklmnpqrstvwxz2456789';
    for (let i = 0; i < length; i++) {
      do {
        randomValue = possible.charAt(Math.floor(Math.random() * possible.length));
      } while (token.search(randomValue) > -1);
      token += randomValue;
    }
    return token;
  }

  public revokeAdminToken() {
    // this.cluster.address.adminToken = this.adminToken;
    this.api.editCluster(this.cluster, this.datacenter.metadata.name, this.project.id).subscribe(res => {
      NotificationActions.success('Success', `Revoke Admin Token successfully`);
      this.dialogRef.close(res);
    });
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }
}
