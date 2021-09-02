import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, FieldSet } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData } from './types';

const { SecretFormField, FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onChangeUrl = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      url: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onChangeUsername = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      username: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  // Secure field (only sent to the backend)
  onChangeSecret = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonData: {
        secret: event.target.value,
      },
    });
  };

  onResetSecret = () => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        secret: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        secret: '',
      },
    });
  };

  render() {
    const { options } = this.props;
    const { jsonData, secureJsonFields } = options;
    const secureJsonData = (options.secureJsonData || {}) as MySecureJsonData;

    return (
      <>
        <FieldSet label="Generel">
          <div className="gf-form">
            <FormField
              label="URL"
              labelWidth={6}
              inputWidth={20}
              onChange={this.onChangeUrl}
              value={jsonData.url || ''}
              tooltip="Which Checkmk Server to connect to. (Example: https://checkmk.server/site)"
            />
          </div>

        </FieldSet>
        <FieldSet label="Authentication">
          <div className="gf-form">
            <FormField
              label="Username"
              labelWidth={6}
              inputWidth={20}
              onChange={this.onChangeUsername}
              value={jsonData.username || ''}
              tooltip="In most usecases, this should be 'automation'."
            />
          </div>
          <div className="gf-form-inline">
            <div className="gf-form">
              <SecretFormField
                isConfigured={(secureJsonFields && secureJsonFields.secret) as boolean}
                value={secureJsonData.secret || ''}
                label="Secret"
                placeholder=""
                labelWidth={6}
                inputWidth={20}
                onReset={this.onResetSecret}
                onChange={this.onChangeSecret}
                tooltip="You can find the password for your automation user in your Checkmk installation under users - automation."
              />
            </div>
          </div>
        </FieldSet>
      </>
    );
  }
}
