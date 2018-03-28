import { Provider } from '../../../shared/interfaces/provider.interface';
import { WizardActions } from '../../../redux/actions/wizard.actions';
import { CreateNodeModel } from '../../../shared/model/CreateNodeModel';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { AddNodeModalData } from '../../../shared/model/add-node-modal-data';
import { ApiService } from '../../../core/services/api/api.service';
import { FormGroup } from '@angular/forms/src/model';

@Component({
  selector: 'kubermatic-add-node-modal',
  templateUrl: './add-node-modal.component.html',
  styleUrls: ['./add-node-modal.component.scss']
})
export class AddNodeModalComponent implements OnInit {

  public nodeModel: CreateNodeModel;
  public form: FormGroup;
  public provider: Provider = { name: '', payload: {} };

  constructor(private api: ApiService,
              @Inject(MAT_DIALOG_DATA) public data: AddNodeModalData) { }

  public ngOnInit(): void {
    this.provider.name = this.data.cluster.provider;

    if (this.provider.name === 'digitalocean') {
      this.provider.payload.token = this.data.cluster.spec.cloud.digitalocean.token;
    }

    WizardActions.formChanged(
      ['wizard', 'nodeForm'],
      {
        node_size: '',
        node_count: 1,
      },
      false
    );
  }

  public addNode(): void {
    let successCounter: number = 0;
    for (let i = 0; i < this.form.value.node_count; i ++) {
      this.api.createClusterNode(this.data.cluster, this.nodeModel, this.data.dc.spec.seed).subscribe(node => {
        successCounter++;
        if (successCounter === this.form.value.node_count) {
          NotificationActions.success('Success', `Node(s) successfully created`);
        }
      });
    }
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
