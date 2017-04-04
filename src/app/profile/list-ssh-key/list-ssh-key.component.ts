import {Component, OnInit, Input} from "@angular/core";
import {ApiService} from "../../api/api.service";
import {SSHKeyEntity} from "../../api/entitiy/SSHKeyEntity";
import {FormBuilder} from "@angular/forms";
import {Store} from "@ngrx/store";
import * as fromRoot from "../../reducers/index";
import {NotificationComponent} from "../../notification/notification.component";

@Component({
  selector: 'kubermatic-list-ssh-key',
  templateUrl: './list-ssh-key.component.html',
  styleUrls: ['./list-ssh-key.component.scss']
})
export class ListSshKeyComponent implements OnInit {
  @Input() sshKeys: Array<SSHKeyEntity>;
  public userProfile: any;

  constructor(private api: ApiService, private formBuilder: FormBuilder, private store: Store<fromRoot.State>) {
    this.store.select(fromRoot.getAuthProfile).subscribe(profile => {
      this.userProfile = profile;
    });
  }

  ngOnInit() {
  }

  public deleteSSHKey(name): void {
    let index = -1;
    let keyName = "";

    this.sshKeys.forEach((key, i) => {
      if (key.name === name) {
        index = i;
        keyName = key.metadata.name;
      }
    });

    if (index > -1) {
      this.api.deleteSSHKey(keyName)
          .subscribe( () => {
                this.sshKeys.splice(index, 1);

                NotificationComponent.success(this.store, "Success", `SSH key ${name} deleted.`);
              },
              error => {
                NotificationComponent.error(this.store, "Error",  `SSH key ${name} could not be deleted. Error: ${error}`);
              });
    } else {
      NotificationComponent.error(this.store, "Error", `Error deleting SSH key ${name}. Please try again.`);
    }
  }

}
