import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { NotificationActions } from '../../redux/actions/notification.actions';
import { ApiService, ProjectService } from '../../core/services';
import { CreateMemberEntity, MemberProject } from '../../shared/entity/MemberEntity';
import { ProjectEntity } from '../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-add-Member',
  templateUrl: './add-Member.component.html',
  styleUrls: ['./add-Member.component.scss']
})
export class AddMemberComponent implements OnInit {
  @Input() project: ProjectEntity;
  public addMemberForm: FormGroup;

  constructor(private api: ApiService,
              private projectService: ProjectService,
              private dialogRef: MatDialogRef<AddMemberComponent>) {
  }

  public ngOnInit() {
    this.addMemberForm = new FormGroup({
      name: new FormControl('', [Validators.required]),
      email: new FormControl('', [Validators.required]),
      group: new FormControl('', [Validators.required]),
    });
  }

  addMember(): void {
    const createMember: CreateMemberEntity = { 
      name: this.addMemberForm.controls.name.value,
      email: this.addMemberForm.controls.email.value,
      projects: [
        {
          group: this.addMemberForm.controls.group.value,
          id: this.project.id,
        }
      ]
    };

    this.api.createMembers(this.project.id, createMember).subscribe(res => {
      this.dialogRef.close(true);
      NotificationActions.success('Success', `Member is added successfully`);
    });
  }
}
