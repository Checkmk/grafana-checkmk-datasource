import React from 'react';

import { DataSource } from '../DataSource';
import { RequestSpec } from '../RequestSpec';
import {
  CheckMkSelect,
  CheckMkSelectNegatable,
  Filter,
  HostLabelFilter,
  HostTagFilter,
  OnlyActiveChildren,
  OnlyActiveChildrenProps,
} from './components';
import { labelForRequestSpecKey } from './utils';

interface FiltersProp extends Omit<OnlyActiveChildrenProps, 'children'> {
  datasource: DataSource;
  onChange(value: Partial<RequestSpec>): void;
}

export const Filters = (props: FiltersProp): JSX.Element => {
  const { requestSpec, restrictedChildrenChoice, datasource, onChange } = props;

  const rs = requestSpec || {};

  const [qSite, setQSite] = React.useState(rs.site);
  const [qHost, setQHost] = React.useState({
    host_name: rs.host_name,
    host_name_regex: rs.host_name_regex,
    host_in_group: rs.host_in_group,
    host_labels: rs.host_labels,
    host_tags: rs.host_tags,
  } as Partial<RequestSpec>);
  const [qService, setQService] = React.useState({
    service: rs.service,
    service_regex: rs.service_regex,
    service_in_group: rs.service_in_group,
  } as Partial<RequestSpec>);

  function setSiteFilter(value: Partial<RequestSpec>) {
    onChange({ ...rs, ...value });
    setQSite(value.site);
  }
  function setHostFilter(value: Partial<RequestSpec>) {
    onChange({ ...rs, ...value });
    setQHost(value);
  }
  function setServiceFilter(value: Partial<RequestSpec>) {
    onChange({ ...rs, ...value });
    setQService(value);
  }

  const siteAutocompleter = React.useCallback(
    async (prefix: string) => {
      return await datasource.contextAutocomplete('sites', {}, prefix, { strict: false });
    },
    [datasource]
  );
  const hostAutocompleter = React.useCallback(
    (prefix: string) =>
      datasource.contextAutocomplete('monitored_hostname', { site: qSite }, prefix, { strict: 'with_source' }),
    [datasource, qSite]
  );
  const hostLabelAutocompleter = React.useCallback(
    // TODO: would have expected that the site is used as context!
    (prefix: string) => datasource.contextAutocomplete('label', {}, prefix, { world: 'core' }),
    [datasource]
  );
  const hostGroupAutocompleter = React.useCallback(
    (prefix: string) =>
      datasource.contextAutocomplete('allgroups', { site: qSite }, prefix, { group_type: 'host', strict: true }),
    [datasource, qSite]
  );
  const hostTagAutocompleter = React.useCallback(
    (prefix: string, mode: 'groups' | 'choices', context: Record<string, unknown>) => {
      if (mode === 'groups') {
        return datasource.contextAutocomplete('tag_groups', { site: qSite, ...context }, prefix, { strict: true });
      } else {
        return (async function () {
          // TODO: would have expected that this is dependent on the site, but does not look like that?
          const response = await datasource.autocompleterRequest('ajax_vs_autocomplete.py', {
            ident: 'tag_groups_opt',
            params: { group_id: context.groupId, strict: true },
            value: prefix,
          });
          return response.data.result.choices.map(([value, label]: [string, string]) => ({
            value,
            label,
          }));
        })();
      }
    },
    [datasource, qSite]
  );

  const serviceAutocompleter = React.useCallback(
    (prefix: string) =>
      datasource.contextAutocomplete('monitored_service_description', { site: qSite, ...qHost }, prefix, {
        strict: true,
      }),
    [datasource, qSite, qHost]
  );
  const serviceGroupAutocompleter = React.useCallback(
    (prefix: string) =>
      datasource.contextAutocomplete('allgroups', { site: qSite, ...qHost }, prefix, {
        group_type: 'service',
        strict: true,
      }),
    [datasource, qSite, qHost]
  );

  if (restrictedChildrenChoice !== undefined && restrictedChildrenChoice.length === 0) {
    return <i>No Filters available</i>;
  }

  return (
    <OnlyActiveChildren
      requestSpec={requestSpec}
      restrictedChildrenChoice={restrictedChildrenChoice}
      showRemoveButton={props.showRemoveButton}
      showAddFilterDropdown={props.showAddFilterDropdown}
    >
      <CheckMkSelect
        requestSpecKey={'site'}
        label={labelForRequestSpecKey('site', requestSpec)}
        value={qSite}
        // TODO: onChange is used by OnlyActiveChildren with undefined as value
        // this should be reflected by the type system.
        onChange={(site) => setSiteFilter({ site: site })}
        autocompleter={siteAutocompleter}
      />
      <CheckMkSelect
        requestSpecKey={'host_name'}
        label={labelForRequestSpecKey('host_name', requestSpec)}
        value={qHost.host_name}
        onChange={(host) => setHostFilter({ ...qHost, host_name: host })}
        autocompleter={hostAutocompleter}
      />
      <Filter
        requestSpecKey="host_name_regex"
        label={labelForRequestSpecKey('host_name_regex', requestSpec)}
        value={qHost.host_name_regex}
        onChange={(host_name_regex) => setHostFilter({ ...qHost, host_name_regex: host_name_regex })}
      />
      <CheckMkSelectNegatable
        requestSpecKey="host_in_group"
        label={labelForRequestSpecKey('host_in_group', requestSpec)}
        value={qHost.host_in_group}
        onChange={(host_in_group) => setHostFilter({ ...qHost, host_in_group: host_in_group })}
        autocompleter={hostGroupAutocompleter}
      />
      <HostLabelFilter
        label={labelForRequestSpecKey('host_labels', requestSpec)}
        requestSpecKey="host_labels"
        value={qHost.host_labels}
        onChange={(host_labels: string[]) => setHostFilter({ ...qHost, host_labels: host_labels })}
        autocompleter={hostLabelAutocompleter}
        inputId="input_host_label"
      />
      <HostTagFilter
        label={labelForRequestSpecKey('host_tags', requestSpec)}
        requestSpecKey="host_tags"
        value={qHost.host_tags}
        onChange={(host_tags) => setHostFilter({ ...qHost, host_tags: host_tags })}
        autocompleter={hostTagAutocompleter}
      />
      <CheckMkSelect
        requestSpecKey={'service'}
        label={labelForRequestSpecKey('service', requestSpec)}
        value={qService.service}
        onChange={(service) => setServiceFilter({ ...qService, service: service })}
        autocompleter={serviceAutocompleter}
      />
      <Filter
        requestSpecKey="service_regex"
        label={labelForRequestSpecKey('service_regex', requestSpec)}
        value={qService.service_regex}
        onChange={(service_regex) => setServiceFilter({ ...qService, service_regex: service_regex })}
      />
      <CheckMkSelectNegatable
        requestSpecKey="service_in_group"
        label={labelForRequestSpecKey('service_in_group', requestSpec)}
        value={qService.service_in_group}
        onChange={(service_in_group) => setServiceFilter({ ...qService, service_in_group: service_in_group })}
        autocompleter={serviceGroupAutocompleter}
      />
    </OnlyActiveChildren>
  );
};
