import {Component, OnChanges, OnDestroy, OnInit, ViewChild, SimpleChanges} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {AllowedRegistriesService} from './service';
import {UserService} from '@core/services/user';
import {AllowedRegistry} from './entity';
import * as _ from 'lodash';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'km-allowed-registries-list',
  templateUrl: './template.html',
})
export class AllowedRegistriesComponent implements OnInit, OnChanges, OnDestroy {
  allowedRegistries: AllowedRegistry[] = [];
  dataSource = new MatTableDataSource<AllowedRegistry>();
  displayedColumns: string[] = ['name', 'registryPrefix', 'actions'];
  @ViewChild(MatSort, {static: true}) sort: MatSort;
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  private readonly _unsubscribe = new Subject<void>();

  constructor(
    private readonly _allowedRegistriesService: AllowedRegistriesService,
    private readonly _userService: UserService
  ) {}

  ngOnInit() {
    this.dataSource.data = this.allowedRegistries;
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.sort.active = 'name';
    this.sort.direction = 'asc';

    this._allowedRegistriesService.allowedRegistries.pipe(takeUntil(this._unsubscribe)).subscribe(allowedRegistries => {
      this.allowedRegistries = allowedRegistries;
      this.dataSource.data = this.allowedRegistries;
    });

    this._userService.currentUserSettings.pipe(takeUntil(this._unsubscribe)).subscribe(settings => {
      this.paginator.pageSize = settings.itemsPerPage;
      this.dataSource.paginator = this.paginator; // Force refresh.
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.allowedRegistries) {
      this.dataSource.data = this.allowedRegistries;
    }
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isPaginatorVisible(): boolean {
    return (
      this.allowedRegistries &&
      this.allowedRegistries.length > 0 &&
      this.paginator &&
      this.allowedRegistries.length > this.paginator.pageSize
    );
  }

  hasNoData(): boolean {
    return _.isEmpty(this.allowedRegistries);
  }
}
