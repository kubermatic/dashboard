import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import {ApiService} from '../../../core/services';
import {NotificationActions} from '../../../redux/actions/notification.actions';
import {CreateProjectModel} from '../../model/CreateProjectModel';

@Component({
  selector: 'kubermatic-add-project-dialog',
  templateUrl: './add-project-dialog.component.html',
  styleUrls: ['./add-project-dialog.component.scss'],
})
export class AddProjectDialogComponent implements OnInit {
  addProjectForm: FormGroup;

  constructor(
      private readonly _apiService: ApiService,
      private readonly _matDialogRef: MatDialogRef<AddProjectDialogComponent>) {}

  ngOnInit(): void {
    this.addProjectForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
    });
  }

  addProject(): void {
    const createProject: CreateProjectModel = {name: this.addProjectForm.controls.name.value};
    this._apiService.createProject(createProject).subscribe((res) => {
      this._matDialogRef.close(res);
      NotificationActions.success(`Project ${createProject.name} is added successfully`);
    });
  }
}
