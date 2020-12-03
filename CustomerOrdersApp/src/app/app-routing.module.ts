import { NgModule } from '@angular/core';
import { RouterModule, Routes, PreloadAllModules, NoPreloading } from '@angular/router';

import { PreloadModulesStrategy } from './core/strategies/preload-modules.strategy';
import { CanActivateGuard } from './core/guards/can-activate.guard';

const app_routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/customers' },
  { path: 'customers/:id', data: { preload: true }, loadChildren: () => import('./customer/customer.module').then(m => m.CustomerModule), canActivate: [CanActivateGuard] },
  { path: 'customers', loadChildren: () => import('./customers/customers.module').then(m => m.CustomersModule), canActivate: [CanActivateGuard] },
  { path: 'orders', data: { preload: true }, loadChildren: () => import('./orders/orders.module').then(m => m.OrdersModule), canActivate: [CanActivateGuard] },
  { path: 'teams-config', loadChildren: () => import('./teams-config/teams-config.module').then(m => m.TeamsConfigModule) },
  { path: '**', pathMatch: 'full', redirectTo: '/customers' } // catch any unfound routes and redirect to home page

];

const isIframe = window !== window.parent && !window.opener;

@NgModule({
  imports: [ RouterModule.forRoot(app_routes, { preloadingStrategy: PreloadModulesStrategy, /* enableTracing: true */ }) ],
  exports: [ RouterModule ],
  providers: [CanActivateGuard, PreloadModulesStrategy]
})
export class AppRoutingModule { }
