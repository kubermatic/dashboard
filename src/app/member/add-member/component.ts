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
import {MemberService} from '@core/services/member';

@Component({
  selector: 'km-add-member',
  templateUrl: './template.html',
})
export class AddMemberComponent implements OnInit {
  @Input() project: Project;
  addMemberForm: FormGroup;

  constructor(
    private readonly _memberService: MemberService,
    private readonly _matDialogRef: MatDialogRef<AddMemberComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.addMemberForm = new FormGroup({
      email: new FormControl('', [Validators.required]),
      group: new FormControl('', [Validators.required]),
    });
  }

  addMember(): void {
    if (!this.addMemberForm.valid) {
      return;
    }

    this._memberService
      .add(
        {
          email: this.addMemberForm.controls.email.value,
          projects: [{group: this.addMemberForm.controls.group.value, id: this.project.id}],
        },
        this.project.id
      )
      .subscribe((member: Member) => {
        this._matDialogRef.close(member);
        this._notificationService.success(`Added the ${member.email} member to the ${this.project.name} project`);
      });
  }
}
