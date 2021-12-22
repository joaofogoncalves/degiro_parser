import { Component, OnInit } from '@angular/core';
import { Transaction, TransactionField, TransactionsService, Product } from 'src/app/transactions.service';
import {animate, state, style, transition, trigger} from '@angular/animations';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ProductsComponent {

  products: Product[] = [];
  columnsToDisplay = ['ISIN', 'label', 'remaining'];
  expandedElement: Product | null = null;


  constructor(private transactionService: TransactionsService) {

    this.transactionService.getProducts$.subscribe( (products: Product[]) => {
      this.products = products;
    })
  }



}
