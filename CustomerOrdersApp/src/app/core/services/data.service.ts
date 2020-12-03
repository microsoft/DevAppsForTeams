import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ICustomer, IOrder, IState, IPagedResults, IApiResponse, ISalesPerson } from '../../shared/interfaces';
import { UtilitiesService } from './utilities.service';
import { TeamsMessengerService } from './teams-messenger.service';
import { CustomerChangeType } from 'src/app/shared/enums';

@Injectable({ providedIn: 'root' })
export class DataService {
    baseUrl = this.utilitiesService.getApiUrl();
    customersBaseUrl = this.baseUrl + '/api/customers';
    ordersBaseUrl = this.baseUrl + '/api/orders';
    orders: IOrder[];
    states: IState[];
    salesPeople: ISalesPerson[];

    constructor(private http: HttpClient, 
                private utilitiesService: UtilitiesService,
                private teamsMessenger: TeamsMessengerService) {  }

    getCustomersPage(page: number, pageSize: number): Observable<IPagedResults<ICustomer[]>> {
        return this.http.get<ICustomer[]>(
            `${this.customersBaseUrl}/page/${page}/${pageSize}`,
            { observe: 'response' })
            .pipe(
                map(res => {
                    const totalRecords = +res.headers.get('X-InlineCount');
                    const customers = res.body as ICustomer[];
                    this.calculateCustomersOrderTotal(customers);
                    return {
                        results: customers,
                        totalRecords: totalRecords
                    };
                }),
                catchError(this.handleError)
            );
    }

    getCustomers(): Observable<ICustomer[]> {
        return this.http.get<ICustomer[]>(this.customersBaseUrl)
            .pipe(
                map(customers => {
                    this.calculateCustomersOrderTotal(customers);
                    return customers;
                }),
                catchError(this.handleError)
            );
    }

    getCustomer(id: number): Observable<ICustomer> {
        return this.http.get<ICustomer>(this.customersBaseUrl + '/' + id)
            .pipe(
                map(customer => {
                    this.calculateCustomersOrderTotal([customer]);
                    return customer;
                }),
                catchError(this.handleError)
            );
    }

    insertCustomer(customer: ICustomer): Observable<ICustomer> {
        return this.http.post<ICustomer>(this.customersBaseUrl, customer)
            .pipe(
                map((customer: ICustomer) => {
                    // Send notification to Teams bot
                    this.teamsMessenger.notifyCustomerChanged(CustomerChangeType.Insert, customer).subscribe();
                    return customer;
                }),
                catchError(this.handleError)
            );
    }

    updateCustomer(customer: ICustomer): Observable<boolean> {
        return this.http.put<IApiResponse>(this.customersBaseUrl + '/' + customer.id, customer)
            .pipe(
                map(res => {
                    // Send notification to Teams bot
                    this.teamsMessenger.notifyCustomerChanged(CustomerChangeType.Update, customer).subscribe();
                    return res.status
                }),
                catchError(this.handleError)
            );
    }

    deleteCustomer(customer: ICustomer): Observable<boolean> {
        return this.http.delete<IApiResponse>(this.customersBaseUrl + '/' + customer.id)
            .pipe(
                map(res => {
                    // Send notification to Teams bot
                    this.teamsMessenger.notifyCustomerChanged(CustomerChangeType.Delete, customer).subscribe();
                    return res.status
                }),
                catchError(this.handleError)
            );
    }

    getStates(): Observable<IState[]> {
        // Cache check
        if (this.states) {
            return of(this.states);
        }

        return this.http.get<IState[]>(this.baseUrl + '/api/states')
            .pipe(
                map(states => {
                    this.states = states;
                    return states;
                }),
                catchError(this.handleError)
            );
    }

    getSalesPeople(): Observable<ISalesPerson[]> {
        // Cache check
        if (this.salesPeople) {
            return of(this.salesPeople);
        }

        return this.http.get<ISalesPerson[]>(this.baseUrl + '/api/salespeople')
            .pipe(
                map(salesPeople => {
                    this.salesPeople = salesPeople;
                    return salesPeople;
                }),
                catchError(this.handleError)
            );
    }

    private handleError(error: HttpErrorResponse) {
        console.error('server error:', error);
        if (error.error instanceof Error) {
            const errMessage = error.error.message;
            return Observable.throw(errMessage);
            // Use the following instead if using lite-server
            // return Observable.throw(err.text() || 'backend server error');
        }
        return Observable.throw(error || 'Node.js server error');
    }

    calculateCustomersOrderTotal(customers: ICustomer[]) {
        for (const customer of customers) {
            if (customer && customer.orders) {
                let total = 0;
                for (const order of customer.orders) {
                    total += order.itemCost;
                }
                customer.orderTotal = total;
            }
        }
    }

    // Not using now but leaving since they show how to create
    // and work with custom observables

    // Would need following import added:
    // import { Observer } from 'rxjs';

    // createObservable(data: any): Observable<any> {
    //     return Observable.create((observer: Observer<any>) => {
    //         observer.next(data);
    //         observer.complete();
    //     });
    // }
    

}
