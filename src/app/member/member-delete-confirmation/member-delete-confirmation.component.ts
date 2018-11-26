import {Component, Input} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {ApiService} from '../../core/services';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {MemberEntity} from '../../shared/entity/MemberEntity';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-member-delete-confirmation',
  templateUrl: './member-delete-confirmation.component.html',
  styleUrls: ['./member-delete-confirmation.component.scss'],
})

export class MemberDeleteConfirmationComponent {
  @Input() project: ProjectEntity;
  @Input() member: MemberEntity;

  constructor(private api: ApiService, private dialogRef: MatDialogRef<MemberDeleteConfirmationComponent>) {}

  deleteMember(): void {
    this.api.deleteMembers(this.project.id, this.member).subscribe(() => {
      NotificationActions.success('Success', `Member has been removed from project`);
    });
    this.dialogRef.close(true);
  }
}
