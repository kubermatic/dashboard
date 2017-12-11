import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AwsAddNodeComponent } from './aws-add-node.component';

describe('AwsAddNodeComponent', () => {
  let component: AwsAddNodeComponent;
  let fixture: ComponentFixture<AwsAddNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AwsAddNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AwsAddNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
