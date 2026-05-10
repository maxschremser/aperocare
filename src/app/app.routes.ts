import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { allowlistGuard } from './guards/allowlist.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup.page').then(m => m.SignupPage)
  },
  {
    path: 'access-denied',
    loadComponent: () => import('./pages/access-denied/access-denied.page').then(m => m.AccessDeniedPage)
  },
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    canActivate: [authGuard, allowlistGuard],
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
        path: 'devices',
        loadComponent: () => import('./pages/devices-list/devices-list.page').then(m => m.DevicesListPage)
      },
      {
        path: 'more',
        loadComponent: () => import('./pages/more/more.page').then(m => m.MorePage)
      }
    ]
  },
  {
    path: 'doctor/:id',
    canActivate: [authGuard, allowlistGuard],
    loadComponent: () => import('./pages/doctor-detail/doctor-detail.page').then(m => m.DoctorDetailPage)
  }
];
