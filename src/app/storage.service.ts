import { Injectable } from '@angular/core';
import { SQLite, SQLiteObject } from '@ionic-enterprise/secure-storage/ngx';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  public create: (encryptionKey: string) => Promise<void>;
  public set: (key: string, value: any) => Promise<void>;
  public get: (key: string) => Promise<any>;
  public remove: (key: string) => Promise<void>;
  public clear: () => Promise<void>;
  public length: () => Promise<number>;
  public keys: () => Promise<string[]>;
  public forEach: (fn: (key: string, value: any, index: number) => void) => Promise<void>;

  private database: SQLiteObject | Storage = null;
  private tableName = '_ionickv';
  private databaseName = '_ionicstorage';
  private localStorageKeyPrefix = `${this.tableName}__`;

  constructor(private sqlite: SQLite) {
    let sqliteAvailable = true;
    if(!(window as any).SQLitePlugin) {
      sqliteAvailable = false;
    }
    this.create = sqliteAvailable ? this.sqliteCreate : this.localStorageCreate;
    this.get = sqliteAvailable ? this.sqliteGet : this.localStorageGet;
    this.set = sqliteAvailable ? this.sqliteSet : this.localStorageSet;
    this.remove = sqliteAvailable ? this.sqliteRemove : this.localStorageRemove;
    this.clear = sqliteAvailable ? this.sqliteClear : this.localStorageClear;
    this.length = sqliteAvailable ? this.sqliteLength : this.localStorageLength;
    this.keys = sqliteAvailable ? this.sqliteKeys : this.localStorageKeys;
    this.forEach = sqliteAvailable ? this.sqliteForEach : this.localStorageForEach;
  }

  private async sqliteCreate(encryptionKey: string): Promise<void> {
    // Create or open a table
    try {
      if (this.database === null) {
        const db = await this.sqlite.create({
          name: this.databaseName,
          location: 'default',
          key: encryptionKey
        });

        this.database = db;
        await db.executeSql(`CREATE TABLE IF NOT EXISTS ${this.tableName}(id INTEGER PRIMARY KEY, key unique, value)`, []);
        console.log('db initialized');
      }
    } catch (e) {
      throw new Error('Unable to initialize database: ' + e.message);
    }
  }
  private async localStorageCreate(encryptionKey: string): Promise<void> {
    if (this.database === null) {
      this.database = localStorage;
      console.log('db initialized');
    }
  }

  private async sqliteSet(key: string, value: any): Promise<void> {
    this.assertSqliteDb();
    return new Promise((resolve, reject) => {
      this.database.transaction((tx) => {
        tx.executeSql(
          `INSERT OR REPLACE INTO ${this.tableName} (key, value) VALUES (?, ?)`,
          [key, value],
          () => {
            resolve();
          }, (error) => {
            reject(error);
          }
        );
      });
    });
  }
  private async localStorageSet(key: string, value: any): Promise<void> {
    return localStorage.setItem(this.localStorageKeyPrefix + key, JSON.stringify({value}));
  }

  private async sqliteGet(key: string): Promise<any> {
    this.assertSqliteDb();
    return new Promise((resolve, reject) => {
      this.database.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM ${this.tableName} WHERE key = ? LIMIT 1`,
          [key],
          (t, result: any) => {
            console.log(result.rows.item(0).value);
            resolve(result.rows.length === 1 ? result.rows.item(0).value : null);
          }, (error) => {
            reject(error);
          }
        );
      });
    });
  }
  private async localStorageGet(key: string): Promise<any> {
    const data: string | null = localStorage.getItem(this.localStorageKeyPrefix + key);
    return data ? JSON.parse(data).value : null;
  }

  private async sqliteRemove(key: string): Promise<void> {
    this.assertSqliteDb();
    return new Promise((resolve, reject) => {
      this.database.transaction((tx) => {
        tx.executeSql(
          `DELETE FROM ${this.tableName} WHERE key = ?`,
          [key],
          () => {
            resolve();
          }, (error) => {
            reject(error);
          }
        );
      });
    });
  }
  private async localStorageRemove(key: string): Promise<any> {
    return localStorage.removeItem(this.localStorageKeyPrefix + key);
  }

  private async sqliteClear(): Promise<void> {
    this.assertSqliteDb();
    return new Promise((resolve, reject) => {
      this.database.transaction((tx) => {
        tx.executeSql(
          `DELETE FROM ${this.tableName}`,
          [],
          () => {
            resolve();
          }, (error) => {
            reject(error);
          }
        );
      });
    });
  }
  private async localStorageClear(): Promise<void> {
    return localStorage.clear();
  }

  private async sqliteLength(): Promise<number> {
    this.assertSqliteDb();
    return new Promise((resolve, reject) => {
      this.database.transaction((tx) => {
        tx.executeSql(
          `SELECT COUNT(key) as c FROM ${this.tableName}`,
          [],
          (t, result) => {
            resolve(result.rows.item(0).c);
          }, (error) => {
            reject(error);
          }
        );
      });
    });
  }
  private async localStorageLength(): Promise<number> {
    return localStorage.length;
  }

  private async sqliteKeys(): Promise<string[]> {
    this.assertSqliteDb();
    return new Promise((resolve, reject) => {
      this.database.transaction((tx) => {
        tx.executeSql(
          `SELECT COUNT(key) as c FROM ${this.tableName}`,
          [],
          (t, result) => {
            const keys = [];
            for (let i = 0; i < result.rows.length; i++) {
              keys.push(result.rows.item(i).key);
            }
            resolve(keys);
          }, (error) => {
            reject(error);
          }
        );
      });
    });
  }
  private async localStorageKeys(): Promise<string[]> {
    const length = localStorage.length;
    const keys = [];
    for(let i = 0; i < length; i++) {
      const rawKey = localStorage.key(i);
      if(rawKey.startsWith(this.localStorageKeyPrefix)) {
        keys.push(rawKey.replace(this.localStorageKeyPrefix, ''));
      }
    }
    return keys;
  }

  private async sqliteForEach(fn: (key: string, value: any, index: number) => void): Promise<void> {
    this.assertSqliteDb();
    return new Promise((resolve, reject) => {
      this.database.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM ${this.tableName}`,
          [],
          (t, result) => {
            const rows = result.rows;
            for (let i = 0; i < rows.length; i++) {
              const item = rows.item(i);
              fn(item.key, item.value, i + 1);
            }
            resolve();
          }, (error) => {
            reject(error);
          }
        );
      });
    });
  }
  private async localStorageForEach(fn: (key: string, value: any, index: number) => void): Promise<void> {
    const keys = await this.localStorageKeys();
    for(let i = 0; i < (await keys).length; i++) {
      const key = keys[i];
      const value = await this.localStorageGet(key);
      const index = i + 1;
      fn(key, value, index);
    }
    return;
  }

  private assertSqliteDb() {
    if (this.database === null) {
      throw new Error('The database has not been initialized. Please run create() before other calls.');
    }
  }
}
