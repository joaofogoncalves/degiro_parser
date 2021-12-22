import { Component } from '@angular/core';
import { Transaction, TransactionField, TransactionsService, Product } from './transactions.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  {
  title = 'degiro-parser';

  transactions: Transaction[] = [];
  transaction_fields: TransactionField[] = [];



  constructor(private transactionService: TransactionsService) {}

  public onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file: File = (target.files as FileList)[0];
    this.transactionService.loadFile(file)
  }


}


