import {Component, OnInit, Output, Input, EventEmitter} from '@angular/core';
import {ApiService} from "../../api/api.service";
import {SSHKeyEntity} from "../../api/entitiy/SSHKeyEntity";
import {FormBuilder, FormGroup, Validators, FormControl} from "@angular/forms";
import {AddSshKeyModalComponent} from "../add-ssh-key-modal/add-ssh-key-modal.component";
import {MdDialog} from '@angular/material';

@Component({
  selector: 'kubermatic-ssh-key-form-field',
  templateUrl: './ssh-key-form-field.component.html',
  styleUrls: ['./ssh-key-form-field.component.scss']
})
export class SshKeyFormFieldComponent implements OnInit {

  public sshKeys: SSHKeyEntity[] = [];
  public config: any = {};

  public sshKeyForm: FormGroup;
  @Output() syncSshKeys = new EventEmitter();
  @Input() sshKeysFormField;
  @Input() provider;



  constructor(private api: ApiService,private formBuilder: FormBuilder, public dialog: MdDialog) { }

  ngOnInit() {
    this.sshKeyForm = this.formBuilder.group({});
    this.refreshSSHKeys();
  }

  public addSshKeyFrom(key) {
    if(this.sshKeysFormField[0][this.provider].some(item => item == key)){
      this.sshKeysFormField[0][this.provider] = this.sshKeysFormField[0][this.provider].filter(item => item !== key);
    } else {
      this.sshKeysFormField[0][this.provider].push(key);
    }
    this.syncSshKeys.emit();
  }

  private refreshSSHKeys() {
    this.api.getSSHKeys().subscribe(result => {
     this.sshKeys = result;

      for (const key of this.sshKeys) {
        const control: FormControl = new FormControl(false, Validators.required);
        this.sshKeyForm.addControl(key.metadata.name, control);
      }
     });
  }

  // TODO: show model
    public addSshKeyDialog(): void {
      var dialogRef = this.dialog.open(AddSshKeyModalComponent, this.config);

      dialogRef.afterClosed().subscribe(result => {
        this.refreshSSHKeys();
      });
    }

}
