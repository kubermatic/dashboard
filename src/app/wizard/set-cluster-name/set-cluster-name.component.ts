import { Observable } from 'rxjs';
import {Component, OnInit, Output, EventEmitter, Input} from '@angular/core';
import {FormGroup, FormBuilder, Validators} from "@angular/forms";
import {ClusterNameGenerator} from "../../core/util/name-generator.service";
import {ClusterNameEntity} from "../../shared/entity/wizard/ClusterNameEntity";
import { select } from '@angular-redux/store/lib/src/decorators/select';

@Component({
  selector: 'kubermatic-set-cluster-name',
  templateUrl: 'set-cluster-name.component.html',
  styleUrls: ['set-cluster-name.component.scss']
})
export class SetClusterNameComponent implements OnInit {
  public clusterNameForm: FormGroup;
  
  @select(['wizard', 'clusterNameForm', 'name']) clusterName$: Observable<string>;
  public clusterName: string = '';

  constructor(private nameGenerator: ClusterNameGenerator,
              private formBuilder: FormBuilder) {
  }

  ngOnInit() {
    this.clusterName$.subscribe(clusterName => {
      clusterName && (this.clusterName = clusterName);
    });

    this.clusterNameForm = this.formBuilder.group({
      name: [this.clusterName, [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    });
  }

  public generateName() {
    this.clusterNameForm.patchValue({name: this.nameGenerator.generateName()});
  }
}
