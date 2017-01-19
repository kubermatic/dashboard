/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ClusterListComponent } from './cluster-list.component';
import { ClusterItemComponent } from "./cluster-item/cluster-item.component";

describe('ClusterListComponent', () => {
  let component: ClusterListComponent;
  let fixture: ComponentFixture<ClusterListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        ClusterListComponent,
        ClusterItemComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
