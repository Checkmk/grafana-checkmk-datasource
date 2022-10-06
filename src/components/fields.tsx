import React from 'react';
import { InlineField, Select } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

export const titleCase = (str: string): string => str[0].toUpperCase() + str.slice(1).toLowerCase();

type GraphKind = 'template' | 'metric';

export const GraphType = (props: { setGraphType: (value: GraphKind) => void }): JSX.Element => {
  const graphTypes: Array<{ value: GraphKind; label: string }> = [
    { value: 'template', label: 'Template' },
    { value: 'metric', label: 'Single metric' },
  ];

  const [graph, setGraph] = React.useState<SelectableValue<GraphKind>>(graphTypes[0]);

  const onChange = (value: SelectableValue<GraphKind>) => {
    setGraph(value);
    props.setGraphType(value.value ?? 'template');
  };

  return (
    <InlineField label="Graph type" labelWidth={14}>
      <Select inputId={'select_Graph'} width={32} options={graphTypes} onChange={onChange} value={graph} />
    </InlineField>
  );
};
