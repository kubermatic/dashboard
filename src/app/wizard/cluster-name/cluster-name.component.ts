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
  public clusterName: {valid: boolean, value:string } = {
    valid : false,
    value : ""
  };

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
    this.syncClusterName();
  }

  public syncClusterName() {
    this.clusterName.valid = this.clusterNameForm.controls['name'].valid;
    this.clusterName.value = this.clusterNameForm.controls['name'].value;
    this.syncName.emit(this.clusterName);
  }
}
