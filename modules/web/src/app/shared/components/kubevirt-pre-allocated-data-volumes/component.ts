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

import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {KubeVirtPreAllocatedDataVolume} from '@shared/entity/cluster';

enum Column {
  Name = 'name',
  Size = 'size',
  StorageClass = 'storageClass',
  URL = 'url',
}

@Component({
  selector: 'km-kubevirt-pre-allocated-data-volumes',
  templateUrl: './template.html',
})
export class KubeVirtPreAllocatedDataVolumesComponent implements OnInit, OnChanges {
  readonly Column = Column;
  readonly displayedColumns: string[] = [Column.Name, Column.Size, Column.StorageClass, Column.URL];

  @Input() dataVolumes: KubeVirtPreAllocatedDataVolume[] = [];

  dataSource = new MatTableDataSource<KubeVirtPreAllocatedDataVolume>();

  ngOnInit(): void {
    this.dataSource.data = this.dataVolumes;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.dataVolumes) {
      this.dataSource.data = this.dataVolumes;
    }
  }

  getSizeNumber(size: string): string {
    return size.match(/\d+/)[0];
  }
}
