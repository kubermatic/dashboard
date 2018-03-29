import { SharedModule } from '../shared/shared.module';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddNodeComponent } from './add-node.component';
import { AwsAddNodeComponent } from './aws-add-node/aws-add-node.component';
import { AddNodeFormComponent } from './add-node-form/add-node-form.component';
import { DigitaloceanAddNodeComponent } from './digitalocean-add-node/digitalocean-add-node.component';
import { OpenstackAddNodeComponent } from './openstack-add-node/openstack-add-node.component';
import { InputValidationService } from '../core/services/index';
import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { ApiService } from '../core/services/api/api.service';
import { ApiMockService } from '../testing/services/api-mock.service';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  NgReduxTestingModule
];

describe('AddNodeComponent', () => {
  let fixture: ComponentFixture<AddNodeComponent>;
  let component: AddNodeComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        AddNodeComponent,
        OpenstackAddNodeComponent,
        AwsAddNodeComponent,
        DigitaloceanAddNodeComponent,
        AddNodeFormComponent
      ],
      providers: [
        InputValidationService,
        { provide: ApiService, useClass: ApiMockService }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNodeComponent);
    component = fixture.componentInstance;
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should render specific form by provider name', () => {
    component.provider = {
      name: 'aws'
    };
    const ngRedux = fixture.debugElement.injector.get(NgRedux);
    const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({
      wizard: {
        nodeForm: {
          ami: '',
          aws_nas: false,
          node_count: 3,
          node_size: 't2.medium',
          root_size: 20
        }
      }
    });
    fixture.detectChanges();

    let deAwsForm = fixture.debugElement.query(By.css('.aws-form'));
    expect(deAwsForm).not.toBeNull('should render aws form');

    component.provider = {
      name: 'openstack',
      payload: {
        cloudSpec: {
          dc: 'openstack-dc',
          openstack: {
            username: '',
            password: '',
            tenant: '',
            domain: '',
            network: '',
            securityGroups: '',
            floatingIpPool: ''
          }
        }
      }
    };
    spyGetState.and.returnValue({
      wizard: {
        nodeForm: {
          os_node_image: '',
          node_count: 2,
          node_size: 'm1.medium'
        }
      }
    });
    fixture.detectChanges();

    deAwsForm = fixture.debugElement.query(By.css('.aws-form'));
    const deOpenstackForm = fixture.debugElement.query(By.css('.openstack-form'));

    expect(deAwsForm).toBeNull('should hide aws form');
    expect(deOpenstackForm).not.toBeNull('should render openstack form');
  });
});
