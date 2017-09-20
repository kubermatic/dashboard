import {Component, OnInit, Output, EventEmitter, Input} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {ClusterNameGenerator} from "../../util/name-generator.service";
import {ClusterNameEntity} from "../../api/entitiy/wizard/ClusterNameEntity";

@Component({
  selector: 'kubermatic-cluster-name',
  templateUrl: './cluster-name.component.html',
  styleUrls: ['./cluster-name.component.scss']
})
export class ClusterNameComponent implements OnInit {
  @Input() clusterName: ClusterNameEntity;
  @Output() syncName = new EventEmitter();
  public clusterNameForm: FormGroup;
  constructor(private nameGenerator: ClusterNameGenerator,
              private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.clusterNameForm = this.formBuilder.group({
      name: [this.clusterName.value, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    });

    this.syncClusterName();
  }

  public generateName() {
    this.clusterNameForm.patchValue({name: this.nameGenerator.generateName()});
    this.syncClusterName();
  }

  public syncClusterName() {
    this.syncName.emit(new ClusterNameEntity(
      this.clusterNameForm.controls['name'].valid,
      this.clusterNameForm.controls['name'].value
    ));
  }
}
