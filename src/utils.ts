import { ScopedVars } from '@grafana/data';
import { getTemplateSrv } from '@grafana/runtime';
import { isUndefined } from 'lodash';

import { Aggregation, FiltersRequestSpec, NegatableOption, RequestSpec, TagValue } from './RequestSpec';
import { CmkQuery } from './types';
import { Presentation } from './ui/autocomplete';
import { requestSpecFromLegacy } from './webapi';

export const titleCase = (str: string): string => str[0].toUpperCase() + str.slice(1).toLowerCase();

export function contextEntryFromNegatableOption(option: NegatableOption, keyName: string) {
  const result: Record<string, unknown> = { [keyName]: option.value };
  if (option.negated) {
    result[`neg_${keyName}`] = 'on';
  }
  return result;
}

export function createCmkContext(
  requestSpec: Partial<RequestSpec>,
  checkmkVersion: 'latest' | '2.1.0' = 'latest'
): Record<string, unknown> {
  const context: Record<string, unknown> = {};

  if (!isUndefined(requestSpec.site)) {
    context['siteopt'] = { site: requestSpec.site };
  }
  if (!isUndefined(requestSpec.host_name)) {
    context['host'] = { host: requestSpec.host_name };
  }
  if (!isUndefined(requestSpec.service)) {
    context['service'] = { service: requestSpec.service };
  }
  if (!isUndefined(requestSpec.host_labels) && requestSpec.host_labels.length !== 0) {
    if (checkmkVersion === 'latest') {
      const count = requestSpec.host_labels.length;
      const hl: Record<string, string> = {
        host_labels_count: '1',
        host_labels_1_bool: 'and',
        host_labels_1_vs_count: `${count}`,
      };
      for (let i = 1; i < count + 1; i++) {
        const label = requestSpec.host_labels[i - 1];
        hl[`host_labels_1_vs_${i}_bool`] = 'and';
        if (label !== undefined) {
          hl[`host_labels_1_vs_${i}_vs`] = label;
        }
      }
      context['host_labels'] = hl;
    } else if (checkmkVersion === '2.1.0') {
      context['host_labels'] = {
        host_label: JSON.stringify(
          requestSpec.host_labels.map((v: string) => {
            return {
              value: v,
            };
          })
        ),
      };
    } else {
      throw new Error(`checkmk version ${checkmkVersion} not known`);
    }
  }

  if (!isUndefined(requestSpec.service_in_group) && requestSpec.service_in_group.value !== '') {
    context['optservicegroup'] = contextEntryFromNegatableOption(requestSpec.service_in_group, 'optservice_group');
  }
  if (!isUndefined(requestSpec.host_name_regex) && requestSpec.host_name_regex.value !== '') {
    context['hostregex'] = contextEntryFromNegatableOption(requestSpec.host_name_regex, 'host_regex');
  }
  if (!isUndefined(requestSpec.host_in_group) && requestSpec.host_in_group.value !== '') {
    context['opthostgroup'] = contextEntryFromNegatableOption(requestSpec.host_in_group, 'opthost_group');
  }
  if (!isUndefined(requestSpec.service_regex) && requestSpec.service_regex.value !== '') {
    context['serviceregex'] = contextEntryFromNegatableOption(requestSpec.service_regex, 'service_regex');
  }

  if (!isUndefined(requestSpec.host_tags) && requestSpec.host_tags.length > 0) {
    const tags: Record<string, string | undefined> = {};
    requestSpec.host_tags.forEach(({ group, tag, operator }, index) => {
      if (tag === undefined && group === undefined && operator === undefined) {
        return;
      }
      tags[`host_tag_${index}_grp`] = group;
      tags[`host_tag_${index}_val`] = tag;
      tags[`host_tag_${index}_op`] = operator;
    });
    context['host_tags'] = tags;
  }

  return context;
}

export function updateQuery(query: CmkQuery): void {
  // convert legacy query (context/params) to new requestSpec interface
  if (query.context !== undefined && query.params !== undefined) {
    // we need to replace the object in place, in order to remove the context
    // and params properties, otherwise both requestSpec and context/params are defined.
    query.requestSpec = requestSpecFromLegacy(query.context, query.params);
    delete query.context;
    delete query.params;
  }
}

export function presentationToAggregation(presentation: Presentation): Aggregation {
  let result: Aggregation = 'off';
  if (presentation === 'lines') {
    result = 'off';
  } else if (presentation === 'min') {
    result = 'minimum';
  } else if (presentation === 'max') {
    result = 'maximum';
  } else {
    result = presentation;
  }
  return result;
}

export function aggregationToPresentation(aggregation: Aggregation): Presentation {
  let result: Presentation = 'lines';
  if (aggregation === 'off') {
    result = 'lines';
  } else if (aggregation === 'minimum') {
    result = 'min';
  } else if (aggregation === 'maximum') {
    result = 'max';
  } else {
    result = aggregation;
  }
  return result;
}

export function replaceVariables(
  requestSpec: Partial<RequestSpec> | undefined,
  scopedVars?: ScopedVars
): Partial<RequestSpec> {
  const result: typeof requestSpec = {};
  const t = getTemplateSrv();
  if (requestSpec === undefined) {
    return result;
  }
  (Object.keys(requestSpec) as Array<keyof Partial<RequestSpec>>).forEach(function <
    T extends keyof Partial<RequestSpec>
  >(key: T) {
    const value = requestSpec[key];
    if (value === undefined) {
      return;
    } else if (typeof value === 'string') {
      result[key] = t.replace(value, scopedVars) as RequestSpec[T];
    } else if (key === 'host_labels' && Array.isArray(value)) {
      const labels = [];
      for (const label of value) {
        labels.push(t.replace(label, scopedVars));
      }
      result['host_labels'] = labels;
    } else if (key === 'host_tags' && Array.isArray(value)) {
      const tags = [];
      for (const tag of value) {
        tags.push({
          group: t.replace(tag.group, scopedVars),
          tag: t.replace(tag.tag, scopedVars),
          operator: tag.operator,
        });
      }
      result['host_tags'] = tags as [TagValue, TagValue, TagValue];
    } else if (typeof value === 'object' && 'value' in value) {
      // NegatableOption
      result[key] = { ...value, value: t.replace(value.value, scopedVars) } as RequestSpec[T];
    } else {
      result[key] = value;
    }
  });
  return result;
}

function _operatorFromNegated(operator: '>=' | '~~', filter: NegatableOption): string {
  if (filter.negated) {
    return '!' + operator;
  } else {
    return operator;
  }
}

export function toLiveStatusQuery(filter: Partial<FiltersRequestSpec>, table: 'host' | 'service') {
  let host_prefix = 'hosts.';
  if (table === 'service') {
    host_prefix = 'services.host_';
  }

  let sites: string[] = [];
  if (filter.site !== undefined && filter.site !== '') {
    sites = [filter.site];
  }

  const queryElements = [];

  if (filter.host_name !== undefined) {
    queryElements.push({ op: '=', left: `${host_prefix}name`, right: filter.host_name });
  }

  if (filter.host_name_regex !== undefined) {
    queryElements.push({
      op: _operatorFromNegated('~~', filter.host_name_regex),
      left: `${host_prefix}name`,
      right: filter.host_name_regex.value,
    });
  }

  if (filter.host_in_group !== undefined) {
    queryElements.push({
      op: _operatorFromNegated('>=', filter.host_in_group),
      left: `${host_prefix}groups`,
      right: filter.host_in_group.value,
    });
  }

  if (filter.host_labels !== undefined) {
    for (const label of filter.host_labels) {
      const split = label.split(':');
      const label_key = split[0];
      const label_value = split[1];
      queryElements.push({
        op: '=',
        left: `${host_prefix}labels`,
        right: `'${label_key}' '${label_value}'`,
      });
    }
  }

  if (filter.host_tags !== undefined) {
    for (const tag of filter.host_tags) {
      if (tag.group !== undefined && tag.tag !== undefined && tag.operator !== undefined) {
        queryElements.push({
          op: tag.operator === 'is' ? '=' : '!=',
          left: `${host_prefix}tags`,
          right: `'${tag.group}' '${tag.tag}'`,
        });
      }
    }
  }

  if (table === 'service') {
    if (filter.service !== undefined) {
      queryElements.push({
        op: '=',
        left: 'services.description',
        right: filter.service,
      });
    }

    if (filter.service_regex !== undefined) {
      queryElements.push({
        op: _operatorFromNegated('~~', filter.service_regex),
        left: 'services.description',
        right: filter.service_regex.value,
      });
    }

    if (filter.service_in_group !== undefined) {
      queryElements.push({
        op: _operatorFromNegated('>=', filter.service_in_group),
        left: 'services.groups',
        right: filter.service_in_group.value,
      });
    }
  }

  let query = {};
  if (queryElements.length !== 0) {
    query = { op: 'and', expr: queryElements };
  }

  return {
    sites: sites,
    query: query,
  };
}
