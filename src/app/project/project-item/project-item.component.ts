import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from '../../core/services';
import { ProjectEntity } from '../../shared/entity/ProjectEntity';

@Component({
  selector: 'kubermatic-project-item',
  templateUrl: './project-item.component.html',
  styleUrls: ['./project-item.component.scss'],
})
export class ProjectItemComponent implements OnInit, OnDestroy {
  @Input() index: number;
  @Input() project: ProjectEntity;

  constructor(private apiService: ApiService) {}

  public ngOnInit(): void { }

  public getProjectItemClass() {
    let itemClass: string;
    if (this.index % 2 !== 0) {
      itemClass = 'odd';
    }
    return itemClass;
  }

  public ngOnDestroy(): void { }
}
