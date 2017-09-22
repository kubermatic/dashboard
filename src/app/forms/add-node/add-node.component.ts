import {Component, Inject} from "@angular/core";
import {FormBuilder} from "@angular/forms";
import {ApiService} from "../../api/api.service";
import {CreateNodeModel} from "../../api/model/CreateNodeModel";
import {NotificationComponent} from "../../notification/notification.component";
import {Store} from "@ngrx/store";
import * as fromRoot from "../../reducers/index";
import {MD_DIALOG_DATA} from "@angular/material";
import {AddNodeModalData} from "./add-node-modal-data";

export abstract class AddNodeComponent {
  abstract GetNodeCreateSpec(): CreateNodeModel;

  constructor(protected api: ApiService, protected formBuilder: FormBuilder, protected store: Store<fromRoot.State>, @Inject(MD_DIALOG_DATA) public data: AddNodeModalData) {
  }

  public addNode(): void {
    let model = this.GetNodeCreateSpec();
    this.api.createClusterNode(this.data.cluster, model)
      .subscribe(
        node => NotificationComponent.success(this.store, "Success", `Node(s) successfully created`),
        error => NotificationComponent.error(this.store, "Error", `${error.status} ${error.statusText}`)
      );
  }
}
