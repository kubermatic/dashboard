import {Component, OnInit, Output, Input, EventEmitter} from '@angular/core';
import {ApiService} from "../../api/api.service";
import {SSHKeyEntity} from "../../api/entitiy/SSHKeyEntity";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'kubermatic-ssh-key-form-field',
  templateUrl: './ssh-key-form-field.component.html',
  styleUrls: ['./ssh-key-form-field.component.scss']
})
export class SshKeyFormFieldComponent implements OnInit {

  public sshKeys: SSHKeyEntity[] = [];

  public sshKeyForm: FormGroup;
  @Output() syncSshKeys = new EventEmitter();
  @Input() sshKeysFormField;

  constructor(private api: ApiService,private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.api.getSSHKeys().subscribe(result => {
      this.sshKeys = result;
    });

    this.sshKeyForm = this.formBuilder.group({
      ssh_key: ["", [<any>Validators.required]]
    });
  }

  public addSshKeyFrom(key) {
    if(this.sshKeysFormField.some(item => item == key)){
      this.sshKeysFormField = this.sshKeysFormField.filter(item => item !== key);
    } else {
      this.sshKeysFormField.push(key);
    }
    console.log(this.sshKeysFormField);
    this.syncSshKeys.emit();
  }

}
