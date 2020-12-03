import {Pipe, PipeTransform} from '@angular/core';
import { ISalesPerson } from '../../shared/interfaces';

@Pipe({name: 'salespersonfinder'})
export class SalesPersonFinderPipe implements PipeTransform {
  transform(salesPersonId: number, salesPeople: ISalesPerson[]) {
    if (!salesPersonId || !salesPeople) {
      return 'None';
    }

    const salesPerson = salesPeople.find(salesPerson => salesPerson.id === salesPersonId);
    if (salesPerson) {
        return salesPerson.firstName/*.charAt(0)*/ + ' ' + salesPerson.lastName;
    }
    
    return 'None';
  }
}