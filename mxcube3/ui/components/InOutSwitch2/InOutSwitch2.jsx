import React from 'react';
import { Row, Col, Label, Button, OverlayTrigger, Popover } from 'react-bootstrap';


export default class InOutSwitch2 extends React.Component {
  constructor(props) {
    super(props);
    this.setIn = this.setIn.bind(this);
    this.setOut = this.setOut.bind(this);
    this.onRightLinkClick = this.onRightLinkClick.bind(this);
  }


  onRightLinkClick(e) {
    this.refs.overlay.handleToggle();
    e.preventDefault();
  }


  setIn() {
    if (this.props.onSave !== undefined) {
      this.props.onSave(this.props.pkey, 'in');
    }

    this.refs.overlay.hide();
  }


  setOut() {
    if (this.props.onSave !== undefined) {
      this.props.onSave(this.props.pkey, 'out');
    }

    this.refs.overlay.hide();
  }


  render() {
    let msgBgStyle = 'warning';
    if (this.props.data.value === 0) {
      msgBgStyle = 'success';
    } else if (this.props.data.value === 1) {
      msgBgStyle = 'danger';
    }

    let btn = <Button block bsSize="small" disabled>---</Button>;
    if (this.props.data.value === 0) {
      btn = <Button block bsSize="small" onClick={this.setIn}>{this.props.offText}</Button>;
    } else if (this.props.data.value === 1) {
      btn = <Button block bsSize="small" onClick={this.setOut}>{this.props.onText}</Button>;
    }

    const msgLabelStyle = { display: 'block', fontSize: '100%', borderRadius: '0px' };

    return (
        <Row>
          <Col xs={12}>
            <OverlayTrigger
              ref="overlay"
              rootClose
              trigger="click"
              placement="bottom"
              overlay={(<Popover>{btn}</Popover>)}
            >
              <div onContextMenu={this.onRightLinkClick}>
                <Label
                  style={{ display: 'block', marginBottom: '3px' }}
                >
                  {this.props.labelText}
                </Label>
                <Label bsStyle={msgBgStyle} style={msgLabelStyle}>{this.props.data.msg}</Label>
              </div>
            </OverlayTrigger>
          </Col>
        </Row>
    );
  }
}


InOutSwitch2.defaultProps = {
  onText: 'Open',
  offText: 'Close',
  labelText: '',
  pkey: undefined,
  onSave: undefined,
  data: { value: 'undefined', state: 'IN', msg: 'UNKNOWN' }
};
