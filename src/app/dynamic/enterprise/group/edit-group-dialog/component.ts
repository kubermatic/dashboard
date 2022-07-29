//                Kubermatic Enterprise Read-Only License
//                       Version 1.0 ("KERO-1.0”)
//                   Copyright © 2022 Kubermatic GmbH
//
// 1. You may only view, read and display for studying purposes the source
//    code of the software licensed under this license, and, to the extent
//    explicitly provided under this license, the binary code.
// 2. Any use of the software which exceeds the foregoing right, including,
//    without limitation, its execution, compilation, copying, modification
//    and distribution, is expressly prohibited.
// 3. THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
//    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//    MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
//    IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
//    CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
//    TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//    SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// END OF TERMS AND CONDITIONS

import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {NotificationService} from '@core/services/notification';
import {Project} from '@shared/entity/project';
import {Observable} from 'rxjs';
import {Group} from '@app/dynamic/enterprise/group/entity';
import {GroupService} from '@app/dynamic/enterprise/group/service';

enum Controls {
  Group = 'group',
  Role = 'role',
}

@Component({
  selector: 'km-edit-group-dialog',
  templateUrl: './template.html',
})
export class EditGroupDialogComponent implements OnInit {
  readonly Controls = Controls;

  @Input() project: Project;
  @Input() group: Group;

  form: FormGroup;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _groupService: GroupService,
    private readonly _matDialogRef: MatDialogRef<EditGroupDialogComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const {group, role} = this.group;
    this.form = this._builder.group({
      [Controls.Group]: this._builder.control(group, Validators.required),
      [Controls.Role]: this._builder.control(role, Validators.required),
    });
  }

  getObservable(): Observable<Group> {
    return this._groupService.edit(
      {
        group: this.form.controls.group.value,
        role: this.form.controls.role.value,
      },
      this.project.id,
      this.group.name
    );
  }

  onNext(): void {
    this._notificationService.success(`Updated the ${this.group.group} group`);
    this._matDialogRef.close(true);
  }
}
