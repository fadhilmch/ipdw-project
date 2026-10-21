import React from 'react';
import PropTypes from 'prop-types';
import * as ToggleGroup from '@radix-ui/react-toggle-group';

const FilterGroup = props => {
  const handleValueChange = value => {
    if (props.onFilterUpdate) {
      props.onFilterUpdate(value);
    }
  };

  return (
    <ToggleGroup.Root
      className="filters"
      type="multiple"
      defaultValue={props.filters}
      onValueChange={handleValueChange}>
      {props.filters.map(title => (
        <ToggleGroup.Item
          key={'filter' + title}
          value={title}
          className="filter-toggle"
          aria-label={`Filter ${title}`}>
          {title}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
};

FilterGroup.propTypes = {
  filters: PropTypes.array,
  onFilterUpdate: PropTypes.func
};

export default FilterGroup;
