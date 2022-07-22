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
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {NotificationService} from '@core/services/notification';
import {Project} from '@shared/entity/project';
import {Observable} from 'rxjs';
import {GroupProjectBinding} from '@app/dynamic/enterprise/project-groups/entity';
import {ProjectGroupBindingService} from '@app/dynamic/enterprise/project-groups/service';

@Component({
  selector: 'km-add-group-dialog',
  templateUrl: './template.html',
})
export class AddGroupDialogComponent implements OnInit {
  form: FormGroup;
  @Input() project: Project;

  constructor(
    private readonly _projectGroupBindingService: ProjectGroupBindingService,
    private readonly _matDialogRef: MatDialogRef<AddGroupDialogComponent>,
    private readonly _notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      group: new FormControl('', [Validators.required]),
      role: new FormControl('', [Validators.required]),
    });
  }

  getObservable(): Observable<GroupProjectBinding> {
    return this._projectGroupBindingService.add(
      {
        group: this.form.controls.group.value,
        role: this.form.controls.role.value,
      },
      this.project.id
    );
  }

  onNext(groupProjectBinding: GroupProjectBinding): void {
    this._projectGroupBindingService.refreshProjectGroupBindings();
    this._notificationService.success(`Added the ${groupProjectBinding.group} to the ${this.project.name} project`);
    this._matDialogRef.close(groupProjectBinding);
  }
}
