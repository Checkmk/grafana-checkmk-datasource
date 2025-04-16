import { DataSourcePluginOptionsEditorProps, SelectableValue } from '@grafana/data';
import { FieldSet, InlineField, LegacyForms, Select } from '@grafana/ui';
import * as process from 'process';
import React, { ChangeEvent, useCallback } from 'react';

import { Settings } from '../settings';
import { DataSourceOptions, Edition, SecureJsonData } from '../types';

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
  const settings = new Settings(jsonData);

  return (
    <>
      <FieldSet label="Monitoring Site">
        <div className="gf-form">
          <FormField
            label="URL"
            labelWidth={6}
            inputWidth={20}
            onChange={onUrlChange}
            value={settings.url || ''}
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
                value={settings.edition}
                placeholder="Select your checkmk edition"
                inputId="checkmk-edition"
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
            onChange={onUsernameChange}
            value={settings.username}
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
