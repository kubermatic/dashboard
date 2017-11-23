import {Component, Inject} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {CreateNodeModel} from "../../../shared/model/CreateNodeModel";
import {NodeCreateSpec} from "../../../shared/entity/NodeEntity";
import {ApiService} from "../../../api/api.service";
import {Store} from "@ngrx/store";
import * as fromRoot from "../../../reducers/index";
import {AddNodeComponent} from "../add-node.component";
import {Size} from "../../../shared/entity/digitalocean/DropletSizeEntity";
import {DigitaloceanNodeSpec} from "../../../shared/entity/node/DigitialoceanNodeSpec";
import {MD_DIALOG_DATA} from "@angular/material";
import {AddNodeModalData} from "../add-node-modal-data";

@Component({
  styleUrls: ['./../add-node.component.scss'],
  selector: 'digitalocean-add-node-form',
  templateUrl: './digitalocean-add-node.component.html',
})

export class DigitaloceanAddNodeComponent extends AddNodeComponent {
  nodeSizes:Size[] = [];
  form: FormGroup;

  constructor(api: ApiService, fb: FormBuilder, store: Store<fromRoot.State>, @Inject(MD_DIALOG_DATA) public data: AddNodeModalData) {
    super(api, fb, store, data);
    this.api.getDigitaloceanSizes(this.data.cluster.spec.cloud.digitalocean.token).subscribe(result => {
        this.nodeSizes = result.sizes;
      }
    );

    this.form = fb.group({
      node_count: [1, [Validators.required, Validators.min(1)]],
      size: ["", [Validators.required]]
    });
  }

  GetNodeCreateSpec(): CreateNodeModel {
    return new CreateNodeModel(
      this.form.controls["node_count"].value,
      new NodeCreateSpec(
        new DigitaloceanNodeSpec(this.form.controls["size"].value),
        null,
        null,
        null,
      )
    );
  }
}
