import React, { PureComponent } from 'react';
import { InlineField, Select } from '@grafana/ui';
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
