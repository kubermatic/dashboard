import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import {ApiService} from '../../core/services';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {MemberEntity} from '../../shared/entity/MemberEntity';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';
import {MemberUtils} from '../../shared/utils/member-utils/member-utils';

@Component({
  selector: 'kubermatic-edit-member',
  templateUrl: './edit-member.component.html',
})
export class EditMemberComponent implements OnInit {
  @Input() project: ProjectEntity;
  @Input() member: MemberEntity;
  editMemberForm: FormGroup;

  constructor(
      private readonly _apiService: ApiService, private readonly _matDialogRef: MatDialogRef<EditMemberComponent>) {}

  ngOnInit(): void {
    this.editMemberForm = new FormGroup({
      group: new FormControl(MemberUtils.getGroupInProject(this.member, this.project.id), [Validators.required]),
    });
  }

  editMember(): void {
    const editMember: MemberEntity = {
      id: this.member.id,
      name: this.member.name,
      email: this.member.email,
      creationTimestamp: this.member.creationTimestamp,
      deletionTimestamp: this.member.deletionTimestamp,
      projects: [
        {
          group: this.editMemberForm.controls.group.value,
          id: this.project.id,
        },
      ],
    };

    this._apiService.editMembers(this.project.id, editMember).subscribe(() => {
      this._matDialogRef.close(true);
      NotificationActions.success('Success', `Member ${this.member.name} is edited successfully`);
    });
  }
}
