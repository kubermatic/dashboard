import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import {ApiService} from '../../core/services';
import {NotificationActions} from '../../redux/actions/notification.actions';
import {CreateMemberEntity, MemberEntity} from '../../shared/entity/MemberEntity';
import {ProjectEntity} from '../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-add-member',
  templateUrl: './add-member.component.html',
})
export class AddMemberComponent implements OnInit {
  @Input() project: ProjectEntity;
  addMemberForm: FormGroup;

  constructor(
      private readonly _apiService: ApiService, private readonly _matDialogRef: MatDialogRef<AddMemberComponent>) {}

  ngOnInit(): void {
    this.addMemberForm = new FormGroup({
      email: new FormControl('', [Validators.required]),
      group: new FormControl('', [Validators.required]),
    });
  }

  addMember(): void {
    const createMember: CreateMemberEntity = {
      email: this.addMemberForm.controls.email.value,
      projects: [{
        group: this.addMemberForm.controls.group.value,
        id: this.project.id,
      }],
    };

    this._apiService.createMembers(this.project.id, createMember).subscribe((member: MemberEntity) => {
      this._matDialogRef.close(member);
      NotificationActions.success(
          'Success', `Member ${member.email} is added successfully to project ${this.project.name}`);
    });
  }
}
