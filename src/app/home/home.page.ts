import { Component, OnInit } from '@angular/core';

import { Storage } from '@ionic/storage-angular';
import IonicSecureStorageDriver from '@ionic-enterprise/secure-storage/driver';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {

  constructor(private storage: Storage) { }

  async ngOnInit() {
    await this.storage.defineDriver(IonicSecureStorageDriver);
    await this.storage.setEncryptionKey('secret');
    await this.storage.create();
  }

  async test() {
    await this.storage.set('blar', 'test');
  }

  async fail() {
    try {
      await this.storage.defineDriver(IonicSecureStorageDriver);
      await this.storage.setEncryptionKey('wrongsecret');
      await this.storage.create();
    } catch (err) {
      alert('Got an expected error creating storage: ' + err);
    }
    try {
      await this.storage.get('blar');
      alert('Shouldnt happen');
    } catch (err) {
      // We should get to here because the get fails
      alert('Got an expected error: ' + err);
    }
  }


}
