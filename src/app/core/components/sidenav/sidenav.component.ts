import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';
import { AddProjectComponent } from '../../../add-project/add-project.component';

@Component({
  selector: 'kubermatic-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent implements OnInit {

  public environment: any = environment;
  public projects: ProjectEntity[];

  constructor(private api: ApiService, public dialog: MatDialog) { }

  ngOnInit() {
    this.getProjects();
  }

  public getProjects() {
    this.api.getProjects().subscribe(res => {
      this.projects = res;
    });
  }

  public selectionChange(event) {
    if (event.value === 'addProject') {
      this.addProject();
    }
  }

  public addProject() {
    const modal = this.dialog.open(AddProjectComponent);
    const sub = modal.afterClosed().subscribe(() => {
      this.reloadProjects();
      sub.unsubscribe();
    });
  }

  public reloadProjects() {
    this.getProjects();
  }

}
