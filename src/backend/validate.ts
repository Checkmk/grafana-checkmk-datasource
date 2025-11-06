import { EditionFamily, getEditionFamily } from 'edition';

import { RequestSpec } from '../RequestSpec';
import { Edition } from '../types';
import { labelForRequestSpecKey } from '../ui/utils';

// 'graph_type' and 'aggregation' should always have a default value
type PotentiallyRequiredKeys = 'site' | 'service' | 'host_name' | 'graph';

const missingRequiredFields = (rq: Partial<RequestSpec>, edition: Edition): string[] => {
  const result: PotentiallyRequiredKeys[] = [];
  if (rq.graph === undefined || rq.graph === '') {
    result.push('graph');
  }

  if (getEditionFamily(edition) === EditionFamily.COMMUNITY) {
    if (rq.site === undefined) {
      result.push('site');
    }
    if (rq.service === undefined || rq.service === '') {
      result.push('service');
    }
    if (rq.host_name === undefined || rq.service === '') {
      result.push('host_name');
    }
  }
  return result.sort().map((value) => labelForRequestSpecKey(value, rq));
};

export const validateRequestSpec = (rq: Partial<RequestSpec> | undefined, edition: Edition): void => {
  if (rq === undefined) {
    rq = {};
  }

  const missingFields = missingRequiredFields(rq, edition);
  if (missingFields.length === 0) {
    return;
  }
  throw new Error(`Please specify a value for the following fields: ${missingFields.join(', ')}`);
};
