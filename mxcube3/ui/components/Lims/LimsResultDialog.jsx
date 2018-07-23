import React from 'react';
import { Modal, Button } from 'react-bootstrap';

import { LimsResultSummary } from './LimsResultSummary';

import { TASK_COLLECTED } from '../../constants';

import './LimsResultDialog.css';

export class LimsResultDialog extends React.Component {
  constructor(props) {
    super(props);
    this.onHide = this.onHide.bind(this);
    this.getResultLink = this.getResultLink.bind(this);
  }

  onHide() {
    this.props.onHide();
  }

  getResultLink() {
    if (this.props.taskData.state !== TASK_COLLECTED) {
      return (<span></span>);
    }

    const link = this.props.taskData.limsResultData ?
            this.props.taskData.limsResultData.limsTaskLink : '';

    return (
      <span>
        <a href={link} target="_blank">View results in ISPyB</a>
      </span>
    );
  }

  render() {
    return (
      <Modal
        dialogClassName="lims-result-dialog"
        show={this.props.show}
        onHide={this.onHide}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Result summary
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          { this.props.taskData ?
            ([<LimsResultSummary taskData={this.props.taskData} />, this.getResultLink()]) : null
          }

        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onHide}>Close</Button>
        </Modal.Footer>
      </Modal>);
  }
}