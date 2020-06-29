import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ClusterService, NotificationService, WizardService} from '../../../core/services';
import {MachineNetworksComponent} from '../../../machine-networks/machine-networks.component';
import {SharedModule} from '../../../shared/shared.module';
import {fakeClusterWithMachineNetwork} from '../../../testing/fake-data/clusterWithMachineNetworks.fake';
import {fakeSeedDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {RouterTestingModule} from '../../../testing/router-stubs';
import {ClusterMockService} from '../../../testing/services/cluster-mock-service';
import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';
import {AddMachineNetworkComponent} from './add-machine-network.component';

const modules: any[] = [BrowserModule, HttpClientModule, BrowserAnimationsModule, RouterTestingModule, SharedModule];

describe('AddMachineNetworkComponent', () => {
  let component: AddMachineNetworkComponent;
  let fixture: ComponentFixture<AddMachineNetworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [AddMachineNetworkComponent, MachineNetworksComponent],
      providers: [
        WizardService,
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        NotificationService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMachineNetworkComponent);
    component = fixture.componentInstance;
    component.cluster = fakeClusterWithMachineNetwork();
    component.projectID = fakeProject().id;
    component.seed = fakeSeedDatacenter();

    fixture.detectChanges();
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });
});
