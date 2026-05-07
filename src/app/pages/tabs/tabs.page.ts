import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, mapOutline, listOutline, searchOutline, statsChartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.css'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel]
})
export class TabsPage {
  constructor() {
    addIcons({ homeOutline, mapOutline, listOutline, searchOutline, statsChartOutline });
  }
}
