import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BringYourOwnClusterComponent } from './bring-your-own.component';

describe('BringYourOwnClusterComponent', () => {
  let component: BringYourOwnClusterComponent;
  let fixture: ComponentFixture<BringYourOwnClusterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BringYourOwnClusterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BringYourOwnClusterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
