import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClusterHealthStatusComponent } from './cluster-health-status.component';
import {MaterialModule, MdTooltip, MdButton} from '@angular/material';

describe('ClusterHealthStatusComponent', () => {
  let component: ClusterHealthStatusComponent;
  let fixture: ComponentFixture<ClusterHealthStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        MdTooltip,
        MdButton
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
