import React from 'react';
export default fn => class AsPure extends React.PureComponent {
  render() {
    return fn(this.props);
  }
}