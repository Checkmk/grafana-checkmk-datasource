import React, { PureComponent } from 'react';
import { Button, InlineField, Input, Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { EditorProps, SelectOptions } from './types';

export const SelectAggregation = (props: EditorProps) => {
  const combined_presentations = [
    { value: 'lines', label: 'Lines' },
    { value: 'stacked', label: 'Stacked' },
    { value: 'sum', label: 'Sum' },
    { value: 'average', label: 'Average' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
  ];

  const onPresentationChange = async ({ value }: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = props;
    onChange({ ...query, params: { ...query.params, presentation: value } });
    onRunQuery();
  };

  return (
    <InlineField label="Aggregation" labelWidth={14}>
      <Select
        width={32}
        options={combined_presentations}
        onChange={onPresentationChange}
        value={props.query.params.presentation}
        placeholder="Aggregation"
      />
    </InlineField>
  );
};

export class CombinedGraphSelect extends PureComponent<EditorProps, SelectOptions<string>> {
  constructor(props: EditorProps) {
    super(props);
    this.state = { options: [] };
  }

  async fillOptions() {
    this.setState({ options: await this.props.datasource.combinedGraphIdent(this.props.query) });
  }

  async componentDidMount() {
    if (!this.state.options.length) {
      this.fillOptions();
    }
  }

  async componentDidUpdate({ query: { params: prevParams } }: EditorProps) {
    if (!this.state.options.length || prevParams !== this.props.query.params) {
      this.fillOptions();
    }
  }

  onGraphChange = ({ value }: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, params: { ...query.params, graph_name: value } });
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

export class FilterEditor extends PureComponent<EditorProps> {
  render() {
    const {
      query: { context },
    } = this.props;
    console.log('filters', context);
    return (
      <>
        {Object.entries(context).map(([filtername, filtervars]) => (
          <SelectFilters {...this.props} filtername={filtername} />
        ))}
      </>
    );
  }
}

export const SelectFilters = (props: EditorProps) => {
  const all_filters = [
    { value: 'hostname', label: 'Hostname' },
    { value: 'hostregex', label: 'Hostname regex' },
    { value: 'serviceregex', label: 'Service regex' },
    { value: 'host_labels', label: 'Host Labels' },
  ];
  const context = props.query.context || {};

  const available_filters = all_filters.filter(
    ({ value }) => value === props.filtername || !context.hasOwnProperty(value)
  );

  const action = () => {
    const { onChange, query, filtername } = props;
    delete query.context[filtername]
    onChange(query);
  };

  const onFilterChange = ({ value }: SelectableValue<string>) => {
    const { onChange, query } = props;
    onChange({ ...query, context: { ...query.context, [value]: {} } });
  };

  return (
    <>
      <InlineField label="Filter" labelWidth={14}>
        <Select
          width={32}
          options={available_filters}
          onChange={onFilterChange}
          value={props.filtername}
          placeholder="Filter"
        />
      </InlineField>
      <Button icon="minus" variant="secondary" onClick={action}/>
    </>
  );
};
