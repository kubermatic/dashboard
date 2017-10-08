import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KmInputNodesNumberComponent } from './km-input-nodes-number.component';

describe('KmInputNumberComponent', () => {
  let component: KmInputNodesNumberComponent;
  let fixture: ComponentFixture<KmInputNodesNumberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KmInputNodesNumberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KmInputNodesNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
