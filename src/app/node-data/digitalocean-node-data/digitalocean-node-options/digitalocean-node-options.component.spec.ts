import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {SharedModule} from '../../../shared/shared.module';
import {nodeDataFake} from '../../../testing/fake-data/node.fake';
import {DigitaloceanNodeOptionsComponent} from './digitalocean-node-options.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
  HttpClientModule,
];

describe('DigitaloceanNodeOptionsComponent', () => {
  let fixture: ComponentFixture<DigitaloceanNodeOptionsComponent>;
  let component: DigitaloceanNodeOptionsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [DigitaloceanNodeOptionsComponent],
      providers: [NodeDataService, WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitaloceanNodeOptionsComponent);
    component = fixture.componentInstance;
    component.nodeData = nodeDataFake();
    fixture.detectChanges();
  });

  it('should create the digitalocean options cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should have valid form when initializing', () => {
    expect(component.form.valid).toBeTruthy();
  });

  it('should call getDoOptionsData method', () => {
    component.form.controls.ipv6.patchValue(true);
    fixture.detectChanges();

    expect(component.getDoOptionsData()).toEqual({
      spec: {
        digitalocean: {
          size: 's-1vcpu-1gb',
          backups: false,
          ipv6: true,
          monitoring: false,
          tags: [],
        },
      },
      valid: true,
    });
  });
});
