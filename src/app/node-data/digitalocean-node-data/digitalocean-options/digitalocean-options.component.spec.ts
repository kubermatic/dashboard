import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {SharedModule} from '../../../shared/shared.module';
import {nodeDataFake} from '../../../testing/fake-data/node.fake';
import {DigitaloceanOptionsComponent} from './digitalocean-options.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
];

describe('DigitaloceanOptionsComponent', () => {
  let fixture: ComponentFixture<DigitaloceanOptionsComponent>;
  let component: DigitaloceanOptionsComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            DigitaloceanOptionsComponent,
          ],
          providers: [
            NodeDataService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitaloceanOptionsComponent);
    component = fixture.componentInstance;
    component.nodeData = nodeDataFake();
    fixture.detectChanges();
  });

  it('should create the digitalocean options cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should have valid form when initializing', () => {
    expect(component.doOptionsForm.valid).toBeTruthy();
  });

  it('should call getDoOptionsData method', () => {
    component.doOptionsForm.controls.tags.patchValue('test-tag1, test-tag2');
    component.doOptionsForm.controls.ipv6.patchValue(true);
    fixture.detectChanges();

    expect(component.getDoOptionsData()).toEqual({
      spec: {
        digitalocean:
            {size: 's-1vcpu-1gb', backups: false, ipv6: true, monitoring: false, tags: ['test-tag1', 'test-tag2']}
      },
      valid: true
    });
  });
});
