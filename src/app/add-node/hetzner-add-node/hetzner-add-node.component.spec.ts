import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { SharedModule } from '../../shared/shared.module';
import { fakeHetznerCluster } from '../../testing/fake-data/cluster.fake';
import { nodeDataFake } from '../../testing/fake-data/node.fake';
import { HetznerAddNodeComponent } from './hetzner-add-node.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
];

describe('HetznerAddNodeComponent', () => {
  let fixture: ComponentFixture<HetznerAddNodeComponent>;
  let component: HetznerAddNodeComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        HetznerAddNodeComponent,
      ],
      providers: [
        AddNodeService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HetznerAddNodeComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeHetznerCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });

  it('form valid when initializing since hetzner has sane defaults for required fields', () => {
    fixture.detectChanges();
    expect(component.hetznerNodeForm.valid).toBeTruthy();
  });
});
