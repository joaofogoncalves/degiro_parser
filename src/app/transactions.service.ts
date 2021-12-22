import { Injectable } from '@angular/core';
import { Papa, ParseResult } from 'ngx-papaparse';

import { BehaviorSubject, Observable, of } from 'rxjs';


export class Transaction {
  [name: string]: any;

  product: string= ''
  isin: string= ''
  order_id: string = '';
  quantity: number = 0;
  value: number = 0;
  fees: number = 0;
  date: string = '';
  time: string = '';


  //--calcualted
  abs_quantity: number = 0;
  remaining: number = 0;
  datetime: Date = new Date;
  results: number = 0;
  remaining_fees: number = 0;
}

export interface TransactionField {
  key: string;
  label: string;
}

export class Product {
  ISIN: string = '';
  label: string = '';

  remaining: number = 0;

  buys:  Transaction[] = [];
  sells:  Transaction[] = [];

  sort_for_calc(a: Transaction, b: Transaction): number {
    return a.datetime.getTime() - b.datetime.getTime();

  }
  round(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100
  }

  calculate(): Product {
    this.sells = this.sells.sort(this.sort_for_calc)
    this.buys = this.buys.sort(this.sort_for_calc)

    this.sells.forEach( sell => {
      this.buys.forEach( buy => {
        if (sell.remaining > 0 ) {

          let resolved = 0;

          if(buy.remaining > sell.remaining) {
            resolved = sell.remaining
          } else {
            resolved = buy.remaining
          }


          buy.remaining = buy.remaining - resolved;
          sell.remaining = sell.remaining - resolved;

          const buy_value = resolved * (buy.value / buy.abs_quantity)
          const sell_value = resolved * (sell.value / sell.abs_quantity)

          buy.results = this.round(buy.results + (sell_value + buy_value) )
          sell.results = this.round(sell.results + (sell_value + buy_value) )

          buy.remaining_fees = this.round(buy.remaining_fees - buy.fees )
          sell.remaining_fees = this.round(sell.remaining_fees + buy.fees )
        }
      })

    })

    this.buys.forEach(buy => {
      this.remaining = this.remaining + buy.remaining;

    })

    return this;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {

  private transaction_fields: TransactionField[] = [];
  private transactions: Transaction[] = [];

  private products: { [key: string]: Product } = {};


  private start_couunt: number = 1;

  key_mappings: { [key: string]: string; } = {
    'Quantidade': 'quantity',
    'ID da Ordem': 'order_id',
    'Data': 'date',
    'Hora': 'time',
    'Produto': 'product',
    'ISIN': 'isin',
    'Valor': 'value',
    'Custos de transação': 'fees'
  };

  private parse_options = {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    fastMode: true,
    delimiter: ',',
    transformHeader: this.parse_header.bind(this),
    complete: this.parse_results.bind(this)
  }

  protected transactionsSource: BehaviorSubject<Transaction[]> = new BehaviorSubject<Transaction[]>([]);
  getTransactions$: Observable<Transaction[]> = this.transactionsSource.asObservable();

  protected fieldsSource: BehaviorSubject<TransactionField[]> = new BehaviorSubject<TransactionField[]>([]);
  getFields$: Observable<TransactionField[]> = this.fieldsSource.asObservable();

  protected productsSource: BehaviorSubject<Product[]> = new BehaviorSubject<Product[]>([]);
  getProducts$: Observable<Product[]> = this.productsSource.asObservable();


  constructor(private papa: Papa) {
    this.reset()

    this.loadStorage()
  }

  reset(): void {
    this.transaction_fields = [];
    this.transactions = [];

    this.products = {};
    this.start_couunt = 1;
  }

  loadFile(file: File): void {
    this.reset();

    this.papa.parse(file, this.parse_options);
  }

  loadStorage(): void {

    const storage_results: string | null =  localStorage.getItem('results')
    const storage_fields: string | null =  localStorage.getItem('fields')

    const results: any[] = JSON.parse( storage_results ? storage_results : '[]');
    const fields: any[] = JSON.parse( storage_fields ? storage_fields : '[]');

    this.create_transactionFields(fields);
    this.create_transactions(results);

    this.create_Products();

  }

  parse_header (header: string): string {
    return header ? header : ('Moeda'+ this.start_couunt++ )
  }

  parse_results(results: ParseResult, file?: File): void {

    localStorage.setItem('results', JSON.stringify(results.data) );
    localStorage.setItem('fields', JSON.stringify(results.meta.fields) );

    this.create_transactionFields(results.meta.fields);
    this.create_transactions(results.data);
    this.create_Products();

  }


  create_transactions(data: any[]): void {
    this.transactions = data.map( (result: any) => {
      let transaction = new Transaction;

      for (let key in result) {
        if (this.key_mappings[key]) {
          const mapped_key = this.key_mappings[key];

          transaction[mapped_key] = result[key];
        } else {
          transaction[key] = result[key];
        }
      }

      transaction.abs_quantity =  Math.abs(transaction.quantity)
      transaction.remaining = transaction.abs_quantity;
      transaction.remaining_fees = transaction.fees
      transaction.datetime = this.createDate(transaction.date,transaction.time)

      return transaction;
    });

    this.transactionsSource.next(this.transactions);
  }

  create_transactionFields(fields: any[]): void {
    this.transaction_fields = fields.map( (field: string) => {
      let transaction_field: TransactionField = {
        key: this.key_mappings[field] ? this.key_mappings[field] : field,
        label: field
      };

      return transaction_field;
    });

    this.transaction_fields.push({'key': 'remaining', 'label': 'Remaining'})
    this.transaction_fields.push({'key': 'results', 'label': 'Results'})
    this.transaction_fields.push({'key': 'remaining_fees', 'label': 'Fees'})


    this.fieldsSource.next(this.transaction_fields);

  }

  create_Products(): void {
    this.transactions.forEach((transaction: Transaction) => {

      let product = this.products[transaction.isin]

      if(!product) {
        product = new Product()
        product.label = transaction.product;
        product.ISIN = transaction.isin;
      }

      this.products[transaction.isin] = product

      if (transaction.quantity > 0) {
        product.buys.push(transaction);
      } else {
        product.sells.push(transaction);
      }
    });

    const products = Object.entries(this.products).map( ([key, product]) => product.calculate());

    this.productsSource.next(products)
  }


  createDate(date: string, hour: string): Date {
    let datetime = new Date();
    const date_parts = date.split('-');

    datetime.setFullYear(parseInt(date_parts[2]))
    datetime.setMonth(parseInt(date_parts[1])-1)
    datetime.setDate(parseInt(date_parts[0]))

    const hour_parts = hour.split(':');

    datetime.setHours(parseInt(hour_parts[0]))
    datetime.setMinutes(parseInt(hour_parts[1]))

    return datetime
  }
}
