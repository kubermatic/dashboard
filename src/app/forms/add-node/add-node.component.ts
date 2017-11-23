import { NotificationActions } from 'app/redux/actions/notification.actions';
import {Component, Inject} from "@angular/core";
import {FormBuilder} from "@angular/forms";
import {ApiService} from "../../api/api.service";
import {CreateNodeModel} from "../../shared/model/CreateNodeModel";
import {MD_DIALOG_DATA} from "@angular/material";
import {AddNodeModalData} from "./add-node-modal-data";

export abstract class AddNodeComponent {
  abstract GetNodeCreateSpec(): CreateNodeModel;

  constructor(protected api: ApiService, 
              protected formBuilder: FormBuilder, 
              protected notificationActions: NotificationActions,
              @Inject(MD_DIALOG_DATA) public data: AddNodeModalData) {
  }

  public addNode(): void {
    let model = this.GetNodeCreateSpec();
    this.api.createClusterNode(this.data.cluster, model).subscribe(node => {
        this.notificationActions.success("Success", `Node(s) successfully created`);
      });
  }
}
