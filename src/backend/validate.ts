import { NegatableOption, RequestSpec } from '../RequestSpec';
import { Edition } from '../types';
import { labelForRequestSpecKey } from '../ui/utils';

// Type predicate
// eslint-disable-next-line
const isNegatableOption = (value: any): value is NegatableOption => {
  return typeof value.negated === 'boolean';
};

const isDefaultValue = (value: string | NegatableOption | string[] | undefined): boolean => {
  if (typeof value === 'undefined') {
    return true;
  }
  if (typeof value === 'string') {
    return value === '';
  }
  if (isNegatableOption(value)) {
    return value.value !== undefined || value.value !== '';
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  } else {
    throw new Error(`Impossible, Should never happen: isDefaultValue got an Argument of type ${typeof value}`);
  }
};

type PotentiallyRequiredKeys = 'graph_type' | 'aggregation' | 'site' | 'service' | 'host_name' | 'graph';

export const getRequiredFields = (edition: Edition) => {
  const result: PotentiallyRequiredKeys[] = ['graph_type', 'aggregation'];
  if (edition === 'CEE') {
    result.push('graph');
  } else {
    result.push('site', 'service', 'host_name', 'graph');
  }
  return result.sort();
};

const missingRequiredFields = (rq: Partial<RequestSpec>, edition: Edition): string[] => {
  const result: Array<keyof RequestSpec> = [];
  for (const field of getRequiredFields(edition)) {
    if (rq[field] === undefined || isDefaultValue(rq[field])) {
      result.push(field);
    }
  }
  return result.map((value) => labelForRequestSpecKey(value, rq));
};

export const validateRequestSpec = (rq: Partial<RequestSpec> | undefined, edition: Edition): void => {
  if (rq === undefined) {
    rq = { graph_type: 'predefined_graph', aggregation: 'off' };
  }

  const missingFields = missingRequiredFields(rq, edition);
  if (missingFields.length === 0) {
    return;
  }
  throw new Error(`Please specify a value for the following fields: ${missingFields.join(', ')}`);
};
