import { DataSourceOptions, Edition } from './types';

export class Settings {
  protected settings: DataSourceOptions;

  constructor(settings: DataSourceOptions) {
    this.settings = settings;
  }

  get edition(): Edition {
    // cloud instances of this plugin don't save the edition and use this default
    return this.settings.edition ?? 'CEE';
  }

  get url(): string | undefined {
    return this.settings.url;
  }

  get username(): string {
    return this.settings.username ?? '';
  }
}
