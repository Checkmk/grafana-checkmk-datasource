import { DataSourcePluginOptionsEditorProps, SelectableValue } from '@grafana/data';
import { FieldSet, InlineField, LegacyForms, Select } from '@grafana/ui';
import React, { ChangeEvent, PureComponent } from 'react';

import { Backend, DataSourceOptions, Edition, SecureJsonData } from '../types';

const { SecretFormField, FormField } = LegacyForms;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props extends DataSourcePluginOptionsEditorProps<DataSourceOptions, SecureJsonData> {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onUrlChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      url: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onEditionChange = ({ value }: SelectableValue<Edition>): void => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      edition: value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  onBackendChange = ({ value }: SelectableValue<Backend>): void => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        backend: value,
      },
    });
  };

  onUsernameChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      username: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  // Secure field (only sent to the backend)
  onSecretChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      secureJsonData: {
        secret: event.target.value,
      },
    });
  };

  onResetSecret = (): void => {
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

  render(): JSX.Element {
    const { options } = this.props;
    const { jsonData, secureJsonFields } = options;
    const secureJsonData = options.secureJsonData || {};
    interface EditionOption {
      value: Edition;
      label: string;
    }

    const cmkEditions: EditionOption[] = [
      { value: 'CEE', label: 'Commercial editions' },
      { value: 'RAW', label: 'Raw Edition' },
    ];
    if (!jsonData.edition) {
      this.onEditionChange(cmkEditions[0]);
    }
    const cmkBackends: Array<SelectableValue<Backend>> = [
      { value: 'rest', label: '>= 2.2' },
      { value: 'web', label: '< 2.2' },
    ];
    if (!jsonData.backend) {
      this.onBackendChange(cmkBackends[0]);
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
              data-test-id="checkmk-url"
            />
          </div>
          {process.env.BUILD_EDITION !== 'CLOUD' ? (
            <>
              <InlineField label="Edition" labelWidth={12}>
                <Select
                  width={32}
                  options={cmkEditions}
                  onChange={this.onEditionChange}
                  value={jsonData.edition}
                  placeholder="Select your checkmk edition"
                  inputId="checkmk-edition"
                />
              </InlineField>
              <InlineField
                label="Version"
                labelWidth={12}
                tooltip="Choose the appropriate version for your Checkmk installation"
              >
                <Select
                  width={32}
                  options={cmkBackends}
                  onChange={this.onBackendChange}
                  value={jsonData.backend}
                  placeholder="Select your checkmk version"
                  inputId="checkmk-version"
                />
              </InlineField>
            </>
          ) : (
            <></>
          )}
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
              data-test-id="checkmk-username"
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
              data-test-id="checkmk-password"
            />
          </div>
        </FieldSet>
      </>
    );
  }
}
