import { Provider } from 'app/shared/interfaces/provider.interface';
import { WizardActions } from './../../redux/actions/wizard.actions';
import { CreateNodeModel } from 'app/shared/model/CreateNodeModel';
import { NotificationActions } from 'app/redux/actions/notification.actions';
import { Component, OnInit, Inject } from '@angular/core';
import { MD_DIALOG_DATA } from '@angular/material';
import { AddNodeModalData } from '../../shared/model/add-node-modal-data';
import { ApiService } from 'app/core/services/api/api.service';
import { FormGroup } from '@angular/forms/src/model';

@Component({
  selector: 'kubermatic-add-node-modal',
  templateUrl: './add-node-modal.component.html',
  styleUrls: ['./add-node-modal.component.scss']
})
export class AddNodeModalComponent implements OnInit {

  private nodeModel: CreateNodeModel;
  public form: FormGroup;
  public provider: Provider = { name: '', payload: {} };

  constructor(private api: ApiService,
              @Inject(MD_DIALOG_DATA) public data: AddNodeModalData) { }

  public ngOnInit(): void {
    this.provider.name = this.data.cluster.provider;

    if (this.provider.name === 'digitalocean') {
      this.provider.payload.token = this.data.cluster.spec.cloud.digitalocean.token;
    }
  }

  public addNode(): void {
    this.api.createClusterNode(this.data.cluster, this.nodeModel).subscribe(node => {
        NotificationActions.success('Success', `Node(s) successfully created`);
      });
  }

  public changeNodeModel(nodeModel: CreateNodeModel): void {
    this.nodeModel = nodeModel;
  }

  public changeForm(form: FormGroup): void {
    setTimeout(() => {
      this.form = form;
    }, 0);
  }

}
