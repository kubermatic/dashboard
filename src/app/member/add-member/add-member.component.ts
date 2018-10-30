import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { ApiService } from '../../core/services';
import { NotificationActions } from '../../redux/actions/notification.actions';
import { CreateMemberEntity } from '../../shared/entity/MemberEntity';
import { ProjectEntity } from '../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-add-member',
  templateUrl: './add-member.component.html',
  styleUrls: ['./add-member.component.scss']
})
export class AddMemberComponent implements OnInit {
  @Input() project: ProjectEntity;
  public addMemberForm: FormGroup;

  constructor(private api: ApiService,
              private dialogRef: MatDialogRef<AddMemberComponent>) {
  }

  public ngOnInit(): void {
    this.addMemberForm = new FormGroup({
      email: new FormControl('', [Validators.required]),
      group: new FormControl('', [Validators.required]),
    });
  }

  addMember(): void {
    const createMember: CreateMemberEntity = {
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
