import { AfterViewInit, Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { Transaction, TransactionField, TransactionsService } from 'src/app/transactions.service';


@Component({
  selector: 'app-transactions-table',
  templateUrl: './transactions-table.component.html',
  styleUrls: ['./transactions-table.component.scss']
})
export class TransactionsTableComponent implements AfterViewInit {

  @Input() transactions: Transaction[] = [];

  dataSource = new MatTableDataSource<Transaction>();
  displayedColumns: string[] = [];


  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;
  @ViewChild(MatSort) sort: MatSort | undefined;



  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator ? this.paginator : null;
    this.dataSource.sort = this.sort ? this.sort : null;
  }

  transaction_fields: TransactionField[] = [];

  constructor(private transactionService: TransactionsService) {
    this.transactionService.getFields$.subscribe( (transaction_fields: TransactionField[]) => {


      this.transaction_fields = transaction_fields;
    });
  }

  ngOnChanges(changes: SimpleChanges) {

    this.displayedColumns = this.transaction_fields.map(transaction_field => {
      return  transaction_field.key;
    });

    this.dataSource.data = this.transactions;

}



}
