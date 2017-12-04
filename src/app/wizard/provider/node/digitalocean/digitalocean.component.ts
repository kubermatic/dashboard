import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CustomValidators } from "ng2-validation";
import { ApiService } from "app/core/services/api/api.service";
import { NodeInstanceFlavors } from "../../../../shared/model/NodeProviderConstants";
import { NodeCreateSpec } from "../../../../shared/entity/NodeEntity";
import { CreateNodeModel } from "../../../../shared/model/CreateNodeModel";
import { DigitaloceanNodeSpec } from "../../../../shared/entity/node/DigitialoceanNodeSpec";
import { InputValidationService } from '../../../../core/services';
import { WizardActions } from 'app/redux/actions/wizard.actions';
import { select } from '@angular-redux/store';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'kubermatic-node-digitalocean',
  templateUrl: './digitalocean.component.html',
  styleUrls: ['./digitalocean.component.scss']
})
export class DigitaloceanNodeComponent implements OnInit {
  public doNodeForm: FormGroup;
  public nodeSize: any[] =  NodeInstanceFlavors.VOID;
  public nodeSpec: NodeCreateSpec;
  public nodeInstances: number;

  @select(['wizard', 'digitalOceanClusterForm', 'access_token']) token$: Observable<string>;
  public token: string = '';

  constructor(private formBuilder: FormBuilder, 
              private api: ApiService,
              public inputValidationService: InputValidationService,
              private ngRedux: NgRedux<any>) { }

  ngOnInit() {
    this.token$.subscribe(token => {
      if (!token) { return; }
      this.token = token;
      this.getNodeSize(token);
    });

    const reduxStore = this.ngRedux.getState();
    const nodeForm = reduxStore.wizard.digitalOceanNodeForm;

    this.doNodeForm = this.formBuilder.group({
      node_count: [nodeForm.node_count, [<any>Validators.required, CustomValidators.min(1)]],
      node_size: ['', [<any>Validators.required]]
    });
  }

  public getNodeSize(token: string): void {
    if (token.length) {
      this.api.getDigitaloceanSizes(token).subscribe(result => {
          this.nodeSize = result.sizes;
          if (this.nodeSize.length > 0 && this.doNodeForm.controls["node_size"].value === '') {
            this.doNodeForm.patchValue({node_size: '4gb'});
            this.onChange();
          }
        }
      );
    }
  }

  public onChange() {
    this.nodeSpec = new NodeCreateSpec(
      new DigitaloceanNodeSpec(this.doNodeForm.controls["node_size"].value),
      null,
      null,
      null,
    );

    this.nodeInstances = this.doNodeForm.controls["node_count"].value;
    const createNodeModel = new CreateNodeModel(this.nodeInstances, this.nodeSpec);

    WizardActions.setNodeModel(createNodeModel);
  }
}
