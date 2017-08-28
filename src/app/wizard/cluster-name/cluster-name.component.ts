import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {ClusterNameGenerator} from "../../util/name-generator.service";
import {Store} from "@ngrx/store";
import * as fromRoot from "../../reducers/index";

@Component({
  selector: 'kubermatic-cluster-name',
  templateUrl: './cluster-name.component.html',
  styleUrls: ['./cluster-name.component.scss']
})
export class ClusterNameComponent implements OnInit {
  @Output() syncName = new EventEmitter();
  public clusterNameForm: FormGroup;
  //public clusterName: string;

  constructor(private nameGenerator: ClusterNameGenerator,
              private formBuilder: FormBuilder,
              private store: Store<fromRoot.State>) {
  }

  ngOnInit() {

    this.clusterNameForm = this.formBuilder.group({
      name: [this.nameGenerator.generateName(),
        [<any>Validators.required, <any>Validators.minLength(2), <any>Validators.maxLength(50)]],
    });

    this.syncClusterName();
  }

  public refreshName() {
    this.clusterNameForm.patchValue({name: this.nameGenerator.generateName()});
  }

  public syncClusterName() {
    this.syncName.emit(this.clusterNameForm.controls['name'].value);
  }
}
