import { DataSourcePluginOptionsEditorProps, SelectableValue } from '@grafana/data';
import { Alert, FieldSet, InlineField, LegacyForms, Select } from '@grafana/ui';
import React, { ChangeEvent, useCallback } from 'react';

import { Backend, DataSourceOptions, Edition, SecureJsonData } from '../types';

const { SecretFormField, FormField } = LegacyForms;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props extends DataSourcePluginOptionsEditorProps<DataSourceOptions, SecureJsonData> {}

interface EditionOption {
  value: Edition;
  label: string;
}

const cmkEditions: EditionOption[] = [
  { value: 'CEE', label: 'Commercial editions' },
  { value: 'RAW', label: 'Raw Edition' },
];

const cmkBackends: Array<SelectableValue<Backend>> = [
  { value: 'rest', label: '>= 2.2' },
  { value: 'web', label: '< 2.2' },
];

export const ConfigEditor = (props: Props) => {
  const onUrlChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const { onOptionsChange, options } = props;
      const jsonData = {
        ...options.jsonData,
        url: event.target.value,
      };
      onOptionsChange({ ...options, jsonData });
    },
    [props]
  );

  const onEditionChange = useCallback(
    ({ value }: SelectableValue<Edition>): void => {
      const { onOptionsChange, options } = props;
      const jsonData = {
        ...options.jsonData,
        edition: value,
      };
      onOptionsChange({ ...options, jsonData });
    },
    [props]
  );

  const onBackendChange = useCallback(
    ({ value }: SelectableValue<Backend>): void => {
      const { onOptionsChange, options } = props;
      onOptionsChange({
        ...options,
        jsonData: {
          ...options.jsonData,
          backend: value,
        },
      });
    },
    [props]
  );

  const onUsernameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const { onOptionsChange, options } = props;
      const jsonData = {
        ...options.jsonData,
        username: event.target.value,
      };
      onOptionsChange({ ...options, jsonData });
    },
    [props]
  );

  // Secure field (only sent to the backend)
  const onSecretChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const { onOptionsChange, options } = props;
      onOptionsChange({
        ...options,
        secureJsonData: {
          secret: event.target.value,
        },
      });
    },
    [props]
  );

  const onResetSecret = useCallback((): void => {
    const { onOptionsChange, options } = props;
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
  }, [props]);

  const { options } = props;
  const { jsonData, secureJsonFields } = options;
  const secureJsonData = options.secureJsonData || {};

  if (!jsonData.edition) {
    onEditionChange(cmkEditions[0]);
  }

  if (!jsonData.backend) {
    onBackendChange(cmkBackends[0]);
  }

  return (
    <>
      <FieldSet label="Monitoring Site">
        <div className="gf-form">
          <FormField
            label="URL"
            labelWidth={6}
            inputWidth={20}
            onChange={onUrlChange}
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
                onChange={onEditionChange}
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
                onChange={onBackendChange}
                value={jsonData.backend}
                placeholder="Select your checkmk version"
                inputId="checkmk-version"
              />
            </InlineField>
            {jsonData.backend === 'web' && (
              <Alert title="Feature degration warning" severity="warning">
                Note that versions older than 2.1.0 are not officially supported:
                <ul>
                  <li>- Version 2.0.0 may work, but not all features are available.</li>
                  <li>- Version 1.6.0 and earlier will not work at all.</li>
                </ul>
              </Alert>
            )}
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
            onChange={onUsernameChange}
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
            onReset={onResetSecret}
            onChange={onSecretChange}
            tooltip="You can find the secret for your user in your checkmk server under Users."
            data-test-id="checkmk-password"
          />
        </div>
      </FieldSet>
    </>
  );
};
