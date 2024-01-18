import { Backend as BackendType, DataSourceOptions, Edition } from './types';

export class Settings {
  protected settings: DataSourceOptions;

  constructor(settings: DataSourceOptions) {
    this.settings = settings;
  }

  get edition(): Edition {
    // cloud instances of this plugin don't save the edition and use this default
    return this.settings.edition ?? 'CEE';
  }

  get backend(): BackendType {
    // cloud instances of this plugin don't save the backend and use this default
    return this.settings.backend ?? 'rest';
  }

  get url(): string | undefined {
    return this.settings.url;
  }

  get username(): string {
    return this.settings.username ?? '';
  }
}
