import { isUndefined } from 'lodash';

import { Aggregation, NegatableOption, RequestSpec } from './RequestSpec';
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

export function createCmkContext(requestSpec: Partial<RequestSpec>): Record<string, unknown> {
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
    context['host_labels'] = {
      host_label: JSON.stringify(
        requestSpec.host_labels.map((v: string) => {
          return {
            value: v,
          };
        })
      ),
    };
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
