import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
      },
      {
        path: 'karte',
        loadComponent: () => import('./pages/karte/karte.page').then(m => m.KartePage)
      },
      {
        path: 'arztliste',
        loadComponent: () => import('./pages/arztliste/arztliste.page').then(m => m.ArztlistePage)
      },
      {
        path: 'arztsuche',
        loadComponent: () => import('./pages/arztsuche/arztsuche.page').then(m => m.ArztsuchePage)
      },
      {
        path: 'statistik',
        loadComponent: () => import('./pages/statistik/statistik.page').then(m => m.StatistikPage)
      },
      {
        path: 'more',
        loadComponent: () => import('./pages/more/more.page').then(m => m.MorePage)
      }
    ]
  },
  {
    path: 'doctor/:id',
    loadComponent: () => import('./pages/doctor-detail/doctor-detail.page').then(m => m.DoctorDetailPage)
  }
];
