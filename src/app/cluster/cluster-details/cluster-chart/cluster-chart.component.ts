import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { ApiService } from 'app/core/services/api/api.service';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';

@Component({
  selector: 'kubermatic-cluster-chart',
  templateUrl: './cluster-chart.component.html',
  styleUrls: ['./cluster-chart.component.scss']
})
export class ClusterChartComponent implements OnInit, OnDestroy {

  @Input() clusterName: string;

  public cpuChartData: any;
  public memoryChartData: any;
  public diskChartData: any;
  public resourceSummaryChartData: any;

  public timer: any = Observable.timer(0, 10000);
  public sub: Subscription;

  constructor(private api: ApiService) { }


  ngOnInit() {
    this.sub = this.timer.subscribe(() => {
      this.refreshData();
    });
  }

  public ngOnDestroy(): void {
    this.sub && this.sub.unsubscribe();
  }

  public refreshData(): void {

    //this.api.getClusterCpuChart(this.clusterName).subscribe(data => { });

      this.cpuChartData =  {
        chartType: 'LineChart',
        dataTable: [
          ['Year', 'Sales', 'Expenses', 'test', 'test', 'test'],
          ['2004',  1000,      400, 400, 140, 50],
          ['2005',  1170,      460, 400, 0, 1200],
          ['2006',  660,       1120, 400, 0, 600],
          ['2007',  1030,      540, 400, 20, 700]
        ],
        options: {
          legend: {
            position: 'bottom'
          },
          series: {
            0: { color: '#79c447' },
            1: { color: '#0288d1' },
            2: { color: '#CCCCCC' },
            3: { color: 'orange' },
            4: { color: '#ff5454' }
          },
          hAxis: {
            gridlines: {
              color: '#E3E8EC',
            },
            ticks: [5, 10, 15, 20]
          },
          vAxis: {
            title: 'CPU',
            gridlines: {
              color: '#E3E8EC'
            }
          }
        }
      };


    //this.api.getClusterMemoryChart(this.clusterName).subscribe(data => {    });


      this.memoryChartData =  {
        chartType: 'LineChart',
        dataTable: [
          ['Year', 'Sales', 'Expenses'],
          ['2004',  1000,      400],
          ['2005',  1170,      460],
          ['2006',  660,       1120],
          ['2007',  1030,      540]
        ],
        options: {
          legend: {
            position: 'bottom'
          },
          series: {
            0: { color: '#79c447' },
            1: { color: '#0288d1' },
            2: { color: '#CCCCCC' },
            3: { color: 'orange' },
            4: { color: '#ff5454' }
          },
          hAxis: {
            gridlines: {
              color: '#E3E8EC'
            }
          },
          vAxis: {
            title: 'Memory',
            gridlines: {
              color: '#E3E8EC'
            }
          }
        }
      };



    //this.api.getClusterDiskChart(this.clusterName).subscribe(data => {    });

      this.diskChartData =  {
        chartType: 'LineChart',
        dataTable: [
          ['Year', 'Sales', 'Expenses'],
          ['2004',  1000,      400],
          ['2005',  1170,      460],
          ['2006',  660,       1120],
          ['2007',  1030,      540]
        ],
        options: {
          legend: {
            position: 'bottom'
          },
          series: {
            0: { color: '#79c447' },
            1: { color: '#0288d1' },
            2: { color: '#CCCCCC' },
            3: { color: 'orange' },
            4: { color: '#ff5454' }
          },
          vAxis: {
            title: 'Disk',
            gridlines: {
              color: '#E3E8EC'
            }
          },
          hAxis: {
            gridlines: {
              color: '#E3E8EC'
            }
          },
        }
      };



    //this.api.getClusterresourceSummaryChart(this.clusterName).subscribe(data => { });

    this.resourceSummaryChartData =  {
      chartType: 'Table',
      dataTable: [
        ['Resource type', 'Capacity', 'Allocatable', 'Total requested'],
        ['CPU', '2 CPU', '1.93 CPU', '410 mCPU'],
        ['Ephemeral storage', '0 B', '0 B', '0 B'],
        ['GPU', '0 GPU', '0 GPU', '0 GPU'],
        ['Memory', '7.85 GB', '5.92 GB', '310.38 MB'],
        ['Pods', '110', '110', '0'],
        ['Storage', '0 B', '0 B', '0 B']
      ],
      options: {title: 'Resource Summary'}
    };

  }

}
