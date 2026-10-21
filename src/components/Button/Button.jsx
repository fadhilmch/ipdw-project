import React, {useState} from 'react';
import PropTypes from 'prop-types';

const isRegularType = type => ['reset', 'submit', 'button'].includes(type);

const Button = ({
  className = 'btn',
  defaultPushed = false,
  disabled = false,
  text = '',
  type = 'button',
  ...props
}) => {
  const [pushed, setPushed] = useState(defaultPushed);

  return (
    <button
      className={className + ' ' + (pushed ? 'on' : 'off')}
      disabled={disabled}
      id={props.id}
      onClick={() => {
        if (type === 'toggle') {
          setPushed(!pushed);
        }
        if (props.onClick) {
          props.onClick();
        }
      }}
      type={isRegularType(type) ? type : 'button'}>
      {props.icon}
      {text}
    </button>
  );
};

Button.propTypes = {
  className: PropTypes.string,
  defaultPushed: PropTypes.bool,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  onClick: PropTypes.func,
  icon: PropTypes.object,
  text: PropTypes.string,
  type: PropTypes.string
};


export default Button;
