import { Component, OnInit } from '@angular/core';
import { Transaction, TransactionField, TransactionsService, Product } from 'src/app/transactions.service';



@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent {

  transactions: Transaction[] = [];

  constructor(private transactionService: TransactionsService) {
    this.transactionService.getTransactions$.subscribe( (transactions: Transaction[]) => {
      this.transactions = transactions;
    });



  }

}


