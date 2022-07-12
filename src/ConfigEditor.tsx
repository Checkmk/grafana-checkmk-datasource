import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, FieldSet, InlineField, Select } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, SelectableValue } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData, Edition } from './types';

const { SecretFormField, FormField } = LegacyForms;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions, MySecureJsonData> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
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

  onEditionChange = ({ value }: SelectableValue<Edition>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      edition: value,
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

  // Secure field (only sent to the backend)
  onSecretChange = (event: ChangeEvent<HTMLInputElement>) => {
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
    const secureJsonData = options.secureJsonData || {};
    interface EditionOption {
      value: Edition;
      label: string;
    }

    const cmkEditions: EditionOption[] = [
      { value: 'CEE', label: 'Enterprise Editions' },
      { value: 'RAW', label: 'RAW Edition' },
    ];
    if (!jsonData.edition) {
      this.onEditionChange(cmkEditions[0]);
    }

    return (
      <>
        <FieldSet label="Monitoring Site">
          <div className="gf-form">
            <FormField
              label="URL"
              labelWidth={6}
              inputWidth={20}
              onChange={this.onUrlChange}
              value={jsonData.url || ''}
              tooltip="Which Checkmk Server to connect to. (Example: https://checkmk.server/site)"
            />
          </div>
          <InlineField label="Edition" labelWidth={12}>
            <Select
              width={32}
              options={cmkEditions}
              onChange={this.onEditionChange}
              value={jsonData.edition}
              placeholder="Select your checkmk edition"
            />
          </InlineField>
        </FieldSet>
        <FieldSet label="Authentication">
          <div className="gf-form">
            <FormField
              label="Username"
              labelWidth={6}
              inputWidth={20}
              onChange={this.onUsernameChange}
              value={jsonData.username || ''}
              tooltip="A checkmk monitoring user. Don't use 'automation' user, because it has admin rights."
            />
          </div>
          <div className="gf-form">
            <SecretFormField
              isConfigured={(secureJsonFields && secureJsonFields.secret) as boolean}
              value={secureJsonData.secret || ''}
              label="Secret"
              placeholder=""
              labelWidth={6}
              inputWidth={20}
              onReset={this.onResetSecret}
              onChange={this.onSecretChange}
              tooltip="You can find the secret for your user in your checkmk server under Users."
            />
          </div>
        </FieldSet>
      </>
    );
  }
}
