import {Component, Inject} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AWSNodeSpec} from "../../../shared/entity/node/AWSNodeSpec";
import {CreateNodeModel} from "../../../shared/model/CreateNodeModel";
import {NodeCreateSpec} from "../../../shared/entity/NodeEntity";
import {ApiService} from "../../../api/api.service";
import {Store} from "@ngrx/store";
import * as fromRoot from "../../../reducers/index";
import {NodeInstanceFlavors} from "../../../shared/model/NodeProviderConstants";
import {AddNodeComponent} from "../add-node.component";
import {MD_DIALOG_DATA} from "@angular/material";
import {AddNodeModalData} from "../add-node-modal-data";

@Component({
  styleUrls: ['./../add-node.component.scss'],
  selector: 'aws-add-node-form',
  templateUrl: './aws-add-node.component.html',
})

export class AWSAddNodeFormComponent extends AddNodeComponent {
  form: FormGroup;
  instanceTypes:string[] = NodeInstanceFlavors.AWS;

  constructor(api: ApiService, fb: FormBuilder, store: Store<fromRoot.State>, @Inject(MD_DIALOG_DATA) public data: AddNodeModalData) {
    super(api, fb, store, data);
    this.form = fb.group({
      node_count: [1, [Validators.required, Validators.min(1)]],
      instance_type: ["", [Validators.required]],
      root_size: [20, [Validators.required, Validators.min(10), Validators.max(16000)]],
      ami: [""],
    });
  }

  GetNodeCreateSpec(): CreateNodeModel {
    return new CreateNodeModel(
      this.form.controls["node_count"].value,
      new NodeCreateSpec(
        null,
        new AWSNodeSpec(
          this.form.controls["instance_type"].value,
          this.form.controls["root_size"].value,
          "gp2",
          this.form.controls["ami"].value,
        ),
        null,
        null,
      )
    );
  }
}
