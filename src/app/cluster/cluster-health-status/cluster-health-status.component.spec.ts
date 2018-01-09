import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterHealthStatusComponent } from './cluster-health-status.component';
import {MatTooltip, MatButton} from '@angular/material';

describe('ClusterHealthStatusComponent', () => {
  let component: ClusterHealthStatusComponent;
  let fixture: ComponentFixture<ClusterHealthStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MatTooltip,
        MatButton
      ],
      declarations: [ ClusterHealthStatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterHealthStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
