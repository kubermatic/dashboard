import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup } from '@angular/forms/src/model';
import { getProvider } from '../../../shared/entity/ClusterEntity';
import { Provider } from '../../../shared/interfaces/provider.interface';
import { ApiService } from '../../../core/services';
import { AddNodeModalData } from '../../../shared/model/add-node-modal-data';
import { NotificationActions } from '../../../redux/actions/notification.actions';
import { NodeEntity, NodeSpec } from '../../../shared/entity/NodeEntity';

@Component({
  selector: 'kubermatic-add-node-modal',
  templateUrl: './add-node-modal.component.html',
  styleUrls: ['./add-node-modal.component.scss']
})
export class AddNodeModalComponent implements OnInit {

  public nodeModel: NodeEntity;
  public form: FormGroup;
  public provider: Provider = { name: '', payload: {} };

  constructor(private api: ApiService,
              @Inject(MAT_DIALOG_DATA) public data: AddNodeModalData) {
  }

  public ngOnInit(): void {
    this.provider.name = getProvider(this.data.cluster);

    if (this.provider.name === 'digitalocean') {
      this.provider.payload.token = this.data.cluster.spec.cloud.digitalocean.token;
    }
  }

  public addNode(): void {
    let successCounter = 0;
    for (let i = 0; i < this.form.value.node_count; i++) {
      this.api.createClusterNode(this.data.cluster, this.nodeModel, this.data.dc.spec.seed).subscribe(node => {
        successCounter++;
        if (successCounter === this.form.value.node_count) {
          NotificationActions.success('Success', `Node(s) successfully created`);
        }
      });
    }
  }

  public changeNodeModel(node: NodeEntity): void {
    this.nodeModel = node;
  }

  public changeForm(form: FormGroup): void {
    setTimeout(() => {
      this.form = form;
    }, 0);
  }

}
