import { Observable } from 'rxjs/Observable';
import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { MatDialogRefMock } from './../../../testing/services/mat-dialog-ref-mock';
import { ApiService } from '../../../core/services/api/api.service';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { MatDialogRef } from '@angular/material';
import { nodeFake } from '../../../testing/fake-data/node.fake';
import { fakeDigitaloceanDatacenter } from '../../../testing/fake-data/datacenter.fake';
import { NodeDuplicateComponent } from './node-duplicate.component';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('NodeDuplicateComponent', () => {
  let fixture: ComponentFixture<NodeDuplicateComponent>;
  let component: NodeDuplicateComponent;
  let apiService: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        NodeDuplicateComponent
      ],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useClass: ApiMockService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDuplicateComponent);
    component = fixture.componentInstance;

    apiService = fixture.debugElement.injector.get(ApiService);
  });

  it('should create the duplicate node cmp', async(() => {
    expect(component).toBeTruthy();
  }));
});
