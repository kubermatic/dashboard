import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {SharedModule} from '../../../shared/shared.module';
import {nodeDataFake} from '../../../testing/fake-data/node.fake';
import {OpenstackNodeOptionsComponent} from './openstack-node-options.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
  HttpClientModule,
];

describe('OpenstackNodeOptionsComponent', () => {
  let fixture: ComponentFixture<OpenstackNodeOptionsComponent>;
  let component: OpenstackNodeOptionsComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            OpenstackNodeOptionsComponent,
          ],
          providers: [
            NodeDataService,
            WizardService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenstackNodeOptionsComponent);
    component = fixture.componentInstance;
    component.nodeData = nodeDataFake();
    fixture.detectChanges();
  });

  it('should create the vshpere options cmp', () => {
    expect(component).toBeTruthy();
  });
});
