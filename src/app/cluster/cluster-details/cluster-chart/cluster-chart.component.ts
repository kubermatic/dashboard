import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'kubermatic-cluster-chart',
  templateUrl: './cluster-chart.component.html',
  styleUrls: ['./cluster-chart.component.scss']
})
export class ClusterChartComponent implements OnInit {

  public cpuChartData: any;
  public memoryChartData: any;
  public diskChartData: any;
  public resourceSummaryChartData: any;

  constructor() { }

  ngOnInit() {
    this.cpuChartData =  {
      chartType: 'LineChart',
      dataTable: [
        ['Year', 'Sales', 'Expenses'],
        ['2004',  1000,      400],
        ['2005',  1170,      460],
        ['2006',  660,       1120],
        ['2007',  1030,      540]
      ],
      options: {title: 'CPU'}
    };

    this.memoryChartData =  {
      chartType: 'LineChart',
      dataTable: [
        ['Year', 'Sales', 'Expenses'],
        ['2004',  1000,      400],
        ['2005',  1170,      460],
        ['2006',  660,       1120],
        ['2007',  1030,      540]
      ],
      options: {title: 'Memory'}
    };

    this.diskChartData =  {
      chartType: 'LineChart',
      dataTable: [
        ['Year', 'Sales', 'Expenses'],
        ['2004',  1000,      400],
        ['2005',  1170,      460],
        ['2006',  660,       1120],
        ['2007',  1030,      540]
      ],
      options: {title: 'Disk'}
    };

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
