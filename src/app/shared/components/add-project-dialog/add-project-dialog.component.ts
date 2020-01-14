import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material/dialog';
import {NotificationsService} from 'angular2-notifications';

import {ApiService} from '../../../core/services';
import {ResourceType} from '../../entity/LabelsEntity';
import {CreateProjectModel} from '../../model/CreateProjectModel';
import {AsyncValidators} from '../../validators/async-label-form.validator';

@Component({
  selector: 'kubermatic-add-project-dialog',
  templateUrl: './add-project-dialog.component.html',
  styleUrls: ['./add-project-dialog.component.scss'],
})
export class AddProjectDialogComponent implements OnInit {
  form: FormGroup;
  labels: object;
  asyncLabelValidators = [AsyncValidators.RestrictedLabelKeyName(ResourceType.Project)];

  constructor(
      private readonly _apiService: ApiService, private readonly _matDialogRef: MatDialogRef<AddProjectDialogComponent>,
      private readonly _notificationService: NotificationsService) {}

  ngOnInit(): void {
    this.form = new FormGroup({
      name: new FormControl('', [Validators.required]),
      labels: new FormControl(''),
    });
  }

  addProject(): void {
    const createProject: CreateProjectModel = {
      name: this.form.controls.name.value,
      labels: this.labels,
    };
    this._apiService.createProject(createProject).subscribe((res) => {
      this._matDialogRef.close(res);
      this._notificationService.success(`Project ${createProject.name} is added successfully`);
    });
  }
}
