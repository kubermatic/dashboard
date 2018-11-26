import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {filter, map, mergeMap} from 'rxjs/operators';
import {BreadcrumbActions} from '../redux/actions/breadcrumb.actions';

@Component({
  selector: 'kubermatic-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events
        .pipe(
            filter((event) => event instanceof NavigationEnd),
            map(() => this.activatedRoute),
            map((route) => {
              while (route.firstChild) {
                route = route.firstChild;
              }

              return route;
            }),
            filter((route) => route.outlet === 'primary'),
            mergeMap((route) => route.data),
            )
        .subscribe((event) => {
          BreadcrumbActions.putBreadcrumb(event['title']);
        });
  }

  ngOnInit(): void {}
}
