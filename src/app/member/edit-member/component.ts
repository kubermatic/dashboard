// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Input, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {NotificationService} from '@core/services/notification';
import {Member} from '@shared/entity/member';
import {Project} from '@shared/entity/project';
import {MemberUtils} from '@shared/utils/member-utils/member-utils';
import {MemberService} from '@core/services/member';

@Component({
  selector: 'km-edit-member',
  templateUrl: './template.html',
})
export class EditMemberComponent implements OnInit {
  @Input() project: Project;
  @Input() member: Member;
  form: FormGroup;

  constructor(
    private readonly _memberService: MemberService,
    private readonly _matDialogRef: MatDialogRef<EditMemberComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      group: new FormControl(MemberUtils.getGroupInProject(this.member, this.project.id), [Validators.required]),
    });
  }

  editMember(): void {
    if (!this.form.valid) {
      return;
    }

    this._memberService
      .edit(
        {
          id: this.member.id,
          name: this.member.name,
          email: this.member.email,
          creationTimestamp: this.member.creationTimestamp,
          deletionTimestamp: this.member.deletionTimestamp,
          projects: [{group: this.form.controls.group.value, id: this.project.id}],
        },
        this.project.id
      )
      .subscribe(() => {
        this._matDialogRef.close(true);
        this._notificationService.success(`The ${this.member.name} member was updated`);
      });
  }
}
