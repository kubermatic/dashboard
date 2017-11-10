import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AWSClusterComponent } from './aws.component';

describe('AWSClusterComponent', () => {
  let component: AWSClusterComponent;
  let fixture: ComponentFixture<AWSClusterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AWSClusterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AWSClusterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
