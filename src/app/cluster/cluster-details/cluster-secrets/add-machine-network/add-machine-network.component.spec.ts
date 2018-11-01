import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { ApiService, WizardService,  } from '../../../../core/services';
import { MachineNetworksComponent } from '../../../../machine-networks/machine-networks.component';
import { fakeClusterWithMachineNetwork } from '../../../../testing/fake-data/clusterWithMachineNetworks.fake';
import { fakeDigitaloceanDatacenter } from '../../../../testing/fake-data/datacenter.fake';
import { fakeProject } from '../../../../testing/fake-data/project.fake';
import { RouterTestingModule } from '../../../../testing/router-stubs';
import { ApiMockService } from '../../../../testing/services/api-mock.service';
import { MatDialogRefMock } from '../../../../testing/services/mat-dialog-ref-mock';
import { SharedModule } from '../../../../shared/shared.module';
import { AddMachineNetworkComponent } from './add-machine-network.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  NgReduxTestingModule,
  SharedModule
];

describe('AddMachineNetworkComponent', () => {
  let component: AddMachineNetworkComponent;
  let fixture: ComponentFixture<AddMachineNetworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        AddMachineNetworkComponent,
        MachineNetworksComponent
      ],
      providers: [
        WizardService,
        { provide: ApiService, useClass: ApiMockService },
        { provide: MatDialogRef, useClass: MatDialogRefMock }
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMachineNetworkComponent);
    component = fixture.componentInstance;
    component.cluster = fakeClusterWithMachineNetwork();
    component.projectID = fakeProject().id;
    component.datacenter = fakeDigitaloceanDatacenter();

    fixture.detectChanges();
  });

  it('should create the add machine network component', () => {
    expect(component).toBeTruthy();
  });
});
