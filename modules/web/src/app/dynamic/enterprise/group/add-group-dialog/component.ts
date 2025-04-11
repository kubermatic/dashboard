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
import {NON_SPECIAL_CHARACTERS_PATTERN_VALIDATOR} from '@shared/validators/others';
import {Observable} from 'rxjs';
import {Group} from '@app/dynamic/enterprise/group/entity';
import {GroupService} from '@app/dynamic/enterprise/group/service';

enum Controls {
  Group = 'group',
  Role = 'role',
}

@Component({
  selector: 'km-add-group-dialog',
  templateUrl: './template.html',
})
export class AddGroupDialogComponent implements OnInit {
  readonly Controls = Controls;

  form: FormGroup;
  @Input() project: Project;

  constructor(
    private readonly _builder: FormBuilder,
    private readonly _groupService: GroupService,
    private readonly _matDialogRef: MatDialogRef<AddGroupDialogComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = this._builder.group({
      [Controls.Group]: this._builder.control('', [Validators.required, NON_SPECIAL_CHARACTERS_PATTERN_VALIDATOR]),
      [Controls.Role]: this._builder.control('', Validators.required),
    });
  }

  getObservable(): Observable<Group> {
    return this._groupService.add(
      {
        group: this.form.get(Controls.Group).value,
        role: this.form.get(Controls.Role).value,
      },
      this.project.id
    );
  }

  onNext(group: Group): void {
    this._notificationService.success(`Added the ${group.group} group to the ${this.project.name} project`);
    this._matDialogRef.close(group);
  }
}
