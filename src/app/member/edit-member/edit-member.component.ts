// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {ApiService} from '@core/services/api/service';
import {NotificationService} from '@core/services/notification/service';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {MemberUtils} from '@shared/utils/member-utils/member-utils';

@Component({
  selector: 'km-edit-member',
  templateUrl: './edit-member.component.html',
})
export class EditMemberComponent implements OnInit {
  @Input() project: Project;
  @Input() member: Member;
  editMemberForm: FormGroup;

  constructor(
    private readonly _apiService: ApiService,
    private readonly _matDialogRef: MatDialogRef<EditMemberComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.editMemberForm = new FormGroup({
      group: new FormControl(MemberUtils.getGroupInProject(this.member, this.project.id), [Validators.required]),
    });
  }

  editMember(): void {
    const editMember: Member = {
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
      this._notificationService.success(`The ${this.member.name} member was updated`);
    });
  }
}
