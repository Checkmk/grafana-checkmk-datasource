import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions } from './types';

const { FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      url: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      username: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onSecretChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      secret: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  render() {
    const { options } = this.props;
    const { jsonData } = options;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <FormField
            label="URL"
            labelWidth={6}
            inputWidth={20}
            onChange={this.onUrlChange}
            value={jsonData.url || ''}
            placeholder="enter url"
            required
          />
        </div>

        <br />
        <br />
        <h3 className="page-heading">Authentication</h3>
        <div className="gf-form-inline">
          <div className="gf-form">
            <FormField
              label="username"
              labelWidth={6}
              inputWidth={20}
              onChange={this.onUsernameChange}
              value={jsonData.username || ''}
              placeholder="enter username"
              required
            />
          </div>
        </div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <FormField
              label="Secret"
              labelWidth={6}
              inputWidth={20}
              onChange={this.onSecretChange}
              value={jsonData.secret || ''}
              placeholder="enter secret"
              type="password"
            />
          </div>
        </div>
      </div>
    );
  }
}
