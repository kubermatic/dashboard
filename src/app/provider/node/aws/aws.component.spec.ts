import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AwsNodeComponent } from './aws.component';

describe('AwsNodeComponent', () => {
  let component: AwsNodeComponent;
  let fixture: ComponentFixture<AwsNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AwsNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AwsNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
