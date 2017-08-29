import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {ClusterNameGenerator} from "../../util/name-generator.service";

@Component({
  selector: 'kubermatic-cluster-name',
  templateUrl: './cluster-name.component.html',
  styleUrls: ['./cluster-name.component.scss']
})
export class ClusterNameComponent implements OnInit {
  @Output() syncName = new EventEmitter();
  public clusterNameForm: FormGroup;

  constructor(private nameGenerator: ClusterNameGenerator,
              private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.clusterNameForm = this.formBuilder.group({
      name: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    });
  }

  public generateName() {
    this.clusterNameForm.patchValue({name: this.nameGenerator.generateName()});
    this.syncName.emit(this.clusterNameForm.controls['name'].value);
  }

  public syncClusterName() {
    if(this.clusterNameForm.controls['name'].valid) {
      this.syncName.emit(this.clusterNameForm.controls['name'].value);
    } else {
      this.syncName.emit("");
    }
  }
}
