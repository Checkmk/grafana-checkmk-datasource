import { get, isEmpty, update } from 'lodash';
import React, { PureComponent } from 'react';
import { InlineField, QueryField, Select, TypeaheadInput, TypeaheadOutput } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { DataSource } from '../DataSource';
import { MyQuery } from 'types';
import { EditorProps, SelectOptions } from './types';

interface MetricInfo {
  name: string;
  title: string;
}
interface Metrics {
  [key: string]: MetricInfo;
}
interface ServiceInfo {
  metrics: Metrics;
  check_command: string;
}

async function allServiceMetrics(query: MyQuery, datasource: DataSource) {
  const all_service_metrics = await datasource.metricsOfHostQuery(query);
  const available_services = all_service_metrics
    .filter(([_, serviceInfo]) => !isEmpty(serviceInfo['metrics']))
    .sort()
    .map(([service]) => ({
      label: service,
      value: service,
    }));

  return {
    services: available_services,
    allmetrics: all_service_metrics,
  };
}

function prepareSevicesQuery(query: MyQuery) {
  return {
    ...query,
    params: {
      hostname: get(query, 'context.host.host', ''),
      site_id: get(query, 'context.siteopt.site', ''),
      action: 'get_metrics_of_host',
    },
  };
}

interface GraphOfServiceOptions {
  services: Array<SelectableValue<string>>;
  allmetrics: Array<[string, ServiceInfo]>;
}

export class GraphOfServiceQuery extends PureComponent<EditorProps, GraphOfServiceOptions> {
  constructor(props: EditorProps) {
    super(props);
    this.state = { services: [], allmetrics: [] };
  }

  async fillState() {
    const { query, datasource } = this.props;
    const all_service_metrics = await allServiceMetrics(prepareSevicesQuery(query), datasource);
    this.setState(all_service_metrics);
  }

  async componentDidMount() {
    const hostname = get(this, 'props.query.context.host.host', '');
    if (hostname && !this.state.services.length) {
      this.fillState();
    }
  }

  async componentDidUpdate(prevProps: EditorProps) {
    const hostname = get(this, 'props.query.context.host.host', '');
    if (hostname && (!this.state.services.length || get(prevProps, 'query.context.host.host', '') !== hostname)) {
      this.fillState();
    }
  }

  onServiceChange = async ({ value }: SelectableValue<string>) => {
    const { query, onChange } = this.props;
    update(query, 'context.service.service', () => value);
    onChange(query);
  };
  onTypeahead = async (typeahead: TypeaheadInput): Promise<TypeaheadOutput> => {
    console.log(typeahead);

    const result = await this.props.datasource.restRequest('ajax_vs_autocomplete.py', {
      ident: 'monitored_hostname',
      params: { strict: true },
      value: '',
    });

    return {
      suggestions: [
        {
          label: 'Hostnames',
          items: result.data.result.choices.map(([_value, label]: [string, string]) => ({ label })),
        },
      ],
    };
  };

  render() {
    const { query } = this.props;
    return (
      <>
        <QueryField onTypeahead={this.onTypeahead} placeholder="TRUS" portalOrigin="YOUTO" />
        <InlineField labelWidth={14} label="Service">
          <Select
            width={32}
            options={this.state.services}
            onChange={this.onServiceChange}
            value={get(query, 'context.service.service', '')}
            placeholder="Select service"
          />
        </InlineField>
        {query.graphMode === 'graph' && <GraphSelect {...this.props} />}
        {query.graphMode === 'metric' && <MetricSelect {...this.props} allmetrics={this.state.allmetrics} />}
      </>
    );
  }
}

function pickMetrics(all_service_metrics: Array<[string, ServiceInfo]>, service: string) {
  const current_metrics = all_service_metrics.find(([svc, _]) => svc === service);
  return current_metrics
    ? Object.values(current_metrics[1].metrics).map(({ name, title }) => ({
        label: title,
        value: name,
      }))
    : [];
}

type EditorPropsWithMetrics = EditorProps & { allmetrics?: Array<[string, ServiceInfo]> };
export class MetricSelect extends PureComponent<EditorPropsWithMetrics, SelectOptions<string>> {
  constructor(props: EditorPropsWithMetrics) {
    super(props);
    this.state = { options: [] };
  }

  async componentDidUpdate(prevProps: EditorPropsWithMetrics) {
    const allmetrics = get(this.props, 'allmetrics', []);
    const service = this.props.query.params.service;
    if (allmetrics.length && service && (!this.state.options.length || prevProps.query.params.service !== service)) {
      this.setState({ options: pickMetrics(allmetrics, this.props.query.params.service) });
    }
  }

  onMetricChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query } = this.props;
    onChange({ ...query, params: { ...query.params, metric: value } });
  };

  render() {
    return (
      <InlineField labelWidth={14} label="Metric">
        <Select
          width={32}
          options={this.state.options}
          onChange={this.onMetricChange}
          value={this.props.query.params.metric}
          placeholder="Select metric"
        />
      </InlineField>
    );
  }
}
export class GraphSelect extends PureComponent<EditorProps, SelectOptions<number>> {
  constructor(props: EditorProps) {
    super(props);
    this.state = { options: [] };
  }

  async fillOptions() {
    this.setState({ options: await this.props.datasource.graphRecipesQuery(this.props.query) });
  }

  async componentDidMount() {
    const hostname = get(this, 'props.query.context.host.host', '');
    const service = get(this, 'props.query.context.service.service', '');
    if (hostname && service && !this.state.options.length) {
      this.fillOptions();
    }
  }

  async componentDidUpdate({ query: { context: prevContext } }: EditorProps) {
    const hostname = get(this, 'props.query.context.host.host', '');
    const service = get(this, 'props.query.context.service.service', '');
    if (
      hostname &&
      service &&
      (!this.state.options.length ||
        get(prevContext, 'host.host', '') !== hostname ||
        get(prevContext, 'service.service', '') !== service)
    ) {
      this.fillOptions();
    }
  }

  onGraphChange = async ({ value }: SelectableValue<number>) => {
    const { onChange, query, onRunQuery } = this.props;
    update(query, 'params.graph_index', () => value);
    onChange(query);
    onRunQuery();
  };

  render() {
    return (
      <InlineField labelWidth={14} label="Graph">
        <Select
          width={32}
          options={this.state.options}
          onChange={this.onGraphChange}
          value={this.props.query.params.graph_index}
          placeholder="Select graph"
        />
      </InlineField>
    );
  }
}
