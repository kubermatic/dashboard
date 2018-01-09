import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SidenavComponent } from './sidenav.component';
import {Auth} from "../../services/auth/auth.service";
import {RouterTestingModule} from "@angular/router/testing";


describe('SidenavComponent', () => {
  let component: SidenavComponent;
  let fixture: ComponentFixture<SidenavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [ SidenavComponent ],
      providers: [Auth]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
