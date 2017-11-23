import {Component, Inject} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CreateNodeModel} from "../../../shared/model/CreateNodeModel";
import {NodeCreateSpec} from "../../../shared/entity/NodeEntity";
import {ApiService} from "../../../api/api.service";
import {Store} from "@ngrx/store";
import * as fromRoot from "../../../reducers/index";
import {AddNodeComponent} from "../add-node.component";
import {MD_DIALOG_DATA} from "@angular/material";
import {OpenstackNodeSpec} from "../../../shared/entity/node/OpenstackNodeSpec";
import {NodeInstanceFlavors} from "../../../shared/model/NodeProviderConstants";
import {AddNodeModalData} from "../add-node-modal-data";

@Component({
  styleUrls: ['./../add-node.component.scss'],
  selector: 'openstack-add-node-form',
  templateUrl: './openstack-add-node.component.html',
})

export class OpenstackAddNodeComponent extends AddNodeComponent {
  form: FormGroup;
  flavors:string[] = NodeInstanceFlavors.Openstack;

  constructor(api: ApiService, fb: FormBuilder, store: Store<fromRoot.State>, @Inject(MD_DIALOG_DATA) public data: AddNodeModalData) {
    super(api, fb, store, data);
    console.log(this.data.dc);

    this.form = fb.group({
      node_count: [1, [Validators.required, Validators.min(1)]],
      flavor: ["", [Validators.required]],
      image: ["", [Validators.required]]
    });
  }

  GetNodeCreateSpec(): CreateNodeModel {
    return new CreateNodeModel(
      this.form.controls["node_count"].value,
      new NodeCreateSpec(
        null,
        null,
        new OpenstackNodeSpec(
          this.form.controls["flavor"].value,
          this.form.controls["image"].value
        ),
        null,
      )
    );
  }
}
