import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {NotificationService} from '../../core/services';

import {ApiService} from '../../core/services';
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
      private readonly _apiService: ApiService, private readonly _matDialogRef: MatDialogRef<AddMemberComponent>,
      private readonly _notificationService: NotificationService) {}

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
      this._notificationService.success(`Member ${member.email} is added successfully to project ${this.project.name}`);
    });
  }
}
