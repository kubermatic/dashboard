import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';
import {ApiService, ProjectService} from '../core/services';
import {NotificationActions} from '../redux/actions/notification.actions';
import {CreateProjectModel} from '../shared/model/CreateProjectModel';

@Component({
  selector: 'kubermatic-add-project',
  templateUrl: './add-project.component.html',
  styleUrls: ['./add-project.component.scss'],
})
export class AddProjectComponent implements OnInit {
  addProjectForm: FormGroup;

  constructor(
      private api: ApiService, private projectService: ProjectService,
      private dialogRef: MatDialogRef<AddProjectComponent>) {}

  ngOnInit(): void {
    this.addProjectForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
    });
  }

  addProject(): void {
    const createProject: CreateProjectModel = {name: this.addProjectForm.controls.name.value};
    this.api.createProject(createProject).subscribe((res) => {
      this.projectService.changeAndStoreSelectedProject(res);
      this.dialogRef.close(res);
      NotificationActions.success('Success', `Project ${createProject.name} is added successfully`);
    });
  }
}
