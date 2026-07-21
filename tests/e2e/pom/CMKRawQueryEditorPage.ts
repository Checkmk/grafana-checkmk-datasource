import { CmkEdition } from '../constants';
import { CmkQueryEditorPage } from './CmkQueryEditorPage';

export class CmkRawQueryEditorPage extends CmkQueryEditorPage {
  protected _edition: CmkEdition = CmkEdition.CRE;

  async filterBySite(site: string) {
    await this._filterBy('Site', site);
  }

  async filterByHostname(hostname: string) {
    await this._filterBy('Hostname', hostname);
  }

  async filterByService(service: string) {
    await this._filterBy('Service', service);
  }

  async _filterBy(fieldLabel: string, value: string) {
    await this.page.getByLabel(fieldLabel, { exact: true }).fill(value);
    await this.expectSpinners(false);
    await this.page.keyboard.press('Enter');
    await this.expectSpinners(false);
  }
}
