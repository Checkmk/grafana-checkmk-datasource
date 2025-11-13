import { DataSourcePluginOptionsEditorProps, SelectableValue } from '@grafana/data';
/* Select is deprecated, but Combobox is still alpha, so no changes for now */
import { FieldSet, InlineField, Input, SecretInput, Select } from '@grafana/ui';
import { EditionFamilyLabel } from 'edition';
import React, { ChangeEvent, useCallback } from 'react';

import { Settings } from '../settings';
import { DataSourceOptions, Edition, SecureJsonData } from '../types';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Props extends DataSourcePluginOptionsEditorProps<DataSourceOptions, SecureJsonData> {}

interface EditionOption {
  value: Edition;
  label: string;
}

const cmkEditions: EditionOption[] = [
  { value: 'CEE', label: EditionFamilyLabel.COMMERCIAL },
  { value: 'RAW', label: EditionFamilyLabel.COMMUNITY },
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
          <InlineField
            label="URL"
            labelWidth={12}
            tooltip="Which Checkmk Server to connect to. (Example: https://checkmk.server/site)"
          >
            <Input
              label="URL"
              width={40}
              onChange={onUrlChange}
              value={settings.url || ''}
              data-test-id="checkmk-url"
            />
          </InlineField>
        </div>
        <InlineField label="Edition" labelWidth={12}>
          <Select
            width={40}
            options={cmkEditions}
            onChange={onEditionChange}
            value={settings.edition}
            placeholder="Select your checkmk edition"
            inputId="checkmk-edition"
            data-test-id="checkmk-edition"
          />
        </InlineField>
      </FieldSet>
      <FieldSet label="Authentication">
        <div className="gf-form">
          <InlineField
            label="Username"
            labelWidth={12}
            tooltip="A checkmk monitoring user. Don't use 'automation' user, because it has admin rights."
          >
            <Input
              label="Username"
              width={40}
              onChange={onUsernameChange}
              value={settings.username}
              data-test-id="checkmk-username"
            />
          </InlineField>
        </div>
        <div className="gf-form">
          <InlineField
            label="Secret"
            labelWidth={12}
            tooltip="You can find the secret for your user in your checkmk server under Users."
          >
            <SecretInput
              isConfigured={(secureJsonFields && secureJsonFields.secret) as boolean}
              value={secureJsonData.secret || ''}
              label="Secret"
              placeholder=""
              width={40}
              onReset={onResetSecret}
              onChange={onSecretChange}
              data-test-id="checkmk-password"
            />
          </InlineField>
        </div>
      </FieldSet>
    </>
  );
};
