import { Component } from '@angular/core';
import { StorageService } from '../storage.service';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(private storage: StorageService) {}

  async test() {
    try {
      await this.storage.create('secret');
      await this.storage.set('blar', 'test');
      const data = await this.storage.get('blar');
      console.log('blar =', data);
    } catch(e) {
      console.error(e);
    }
  }

}
