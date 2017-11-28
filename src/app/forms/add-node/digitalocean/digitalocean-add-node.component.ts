import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreateNodeModel } from "../../../shared/model/CreateNodeModel";
import { NodeCreateSpec } from "../../../shared/entity/NodeEntity";
import { ApiService } from "app/core/services/api/api.service";
import { AddNodeComponent } from "../add-node.component";
import { Size } from "../../../shared/entity/digitalocean/DropletSizeEntity";
import { DigitaloceanNodeSpec } from "../../../shared/entity/node/DigitialoceanNodeSpec";
import { MD_DIALOG_DATA } from "@angular/material";
import { AddNodeModalData } from "../add-node-modal-data";
import { NotificationActions } from 'app/redux/actions/notification.actions';
import { TextboxField } from 'app/shared/model/dynamic-forms/field-textbox';
import { DropdownField } from 'app/shared/model/dynamic-forms/field-dropdown';
import { FormControlService } from 'app/core/services/form-control/form-control.service';

@Component({
  styleUrls: ['./../add-node.component.scss'],
  selector: 'digitalocean-add-node-form',
  templateUrl: './digitalocean-add-node.component.html',
})

export class DigitaloceanAddNodeComponent extends AddNodeComponent implements OnInit {
  nodeSizes: Size[] = [];
  form: FormGroup;

  fields: any[];

  constructor(api: ApiService,
    fb: FormBuilder,
    notificationActions: NotificationActions,
    private fcs: FormControlService,
    @Inject(MD_DIALOG_DATA) public data: AddNodeModalData) {
    super(api, fb, notificationActions, data);
  }

  public ngOnInit(): void {
    let options = [];
    
    this.api.getDigitaloceanSizes(this.data.cluster.spec.cloud.digitalocean.token)
      .subscribe(result => {
        this.nodeSizes = result.sizes;
        this.nodeSizes.forEach((size) => {
          options.push({
            key: size.slug,
            value: `${size.memory / 1024} GB RAM, ${size.vcpus} CPU${(size.vcpus !== 1) ? 's' : ''}, ${size.price_monthly} per month`
          });
        });
      }
    );

    this.fields = [
      new TextboxField({
        key: 'node_count',
        value: 1,
        required: true,
        placeholder: 'Quantity of Nodes',
        type: 'number',
        minNumber: 1
      }),
      new DropdownField({
        key: 'size',
        placeholder: 'Node Size:',
        options
      })
    ];

    this.form = this.fcs.toFormGroup(this.fields);
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
