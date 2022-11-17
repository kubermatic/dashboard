// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {ClusterByDatacenter} from '@shared/utils/seed-configurations';

enum Column {
  Datacenter = 'datacenter',
  Clusters = 'clustersCount', // # cluster per datacenter
}

@Component({
  selector: 'km-clusters-by-datacenter',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
})
export class ClustersByDatacenterComponent implements OnChanges {
  readonly Column = Column;

  @Input() clustersByDatacenter: ClusterByDatacenter[];
  displayedColumns: string[] = Object.values(Column);
  dataSource = new MatTableDataSource<ClusterByDatacenter>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.clustersByDatacenter) {
      this.dataSource.data = changes.clustersByDatacenter.currentValue;
    }
  }
}
