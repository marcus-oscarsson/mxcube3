import React from 'react';
import { withRouter } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';

import {
  Row, Col, Form,
  FormControl,
  FormGroup,
  Checkbox,
  ControlLabel,
  Button,
  Glyphicon,
  SplitButton,
  DropdownButton,
  InputGroup,
  MenuItem,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';

import { QUEUE_RUNNING } from '../constants';

import {
  sendGetSampleList,
  sendSyncSamples,
  filterAction,
  selectSamplesAction,
} from '../actions/sampleGrid';

import {
  sendClearQueue,
  deleteSamplesFromQueue,
  addSamplesToQueue
} from '../actions/queue';

import { StickyContainer, Sticky } from 'react-sticky';
import { showConfirmCollectDialog } from '../actions/queueGUI';
import { showConfirmClearQueueDialog } from '../actions/general';

import { showTaskForm } from '../actions/taskForm';
import SampleGridContainer from './SampleGridContainer';
import ConfirmActionDialog from '../components/GenericDialog/ConfirmActionDialog';

import { SAMPLE_ITEM_WIDTH,
         SAMPLE_ITEM_SPACE } from '../components/SampleGrid/SampleGridItem';

import '../components/SampleGrid/SampleGrid.css';

class SampleGridViewContainer extends React.Component {

  constructor(props) {
    super(props);
    this.onResize = this.onResize.bind(this);
    this.syncSamples = this.syncSamples.bind(this);
    this.sampleGridFilter = this.sampleGridFilter.bind(this);
    this.getFilterOptionValue = this.getFilterOptionValue.bind(this);
    this.sampleGridClearFilter = this.sampleGridClearFilter.bind(this);
    this.filterIsUsed = this.filterIsUsed.bind(this);
    this.resizeGridContainer = this.resizeGridContainer.bind(this);

    // Methods for handling addition and removal of queue items (Samples and Tasks)
    // Also used by the SampleGridContainer
    this.addSelectedSamplesToQueue = this.addSelectedSamplesToQueue.bind(this);
    this.selectAllSamples = this.selectAllSamples.bind(this);
    this.clearSelectedSamples = this.clearSelectedSamples.bind(this);
    this.showCharacterisationForm = this.showTaskForm.bind(this, 'Characterisation');
    this.showDataCollectionForm = this.showTaskForm.bind(this, 'DataCollection');
    this.showDataCollectionForm = this.showTaskForm.bind(this, 'DataCollection');
    this.showWorkflowForm = this.showTaskForm.bind(this, 'Workflow');
    this.showAddSampleForm = this.showTaskForm.bind(this, 'AddSample');
    this.inQueue = this.inQueue.bind(this);
    this.inQueueDeleteElseAddSamples = this.inQueueDeleteElseAddSamples.bind(this);
    this.removeSelectedSamples = this.removeSelectedSamples.bind(this);

    this.collectButton = this.collectButton.bind(this);
    this.startCollect = this.startCollect.bind(this);
  }


  componentDidMount() {
    window.addEventListener('resize', this.onResize, false);
    this.resizeGridContainer();
  }


  componentDidUpdate() {
    this.resizeGridContainer();
  }


  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }


  onResize() {
    this.forceUpdate();
  }


  /**
   * Mapping between a input and a filter option value
   *
   * @param {string} id - id of input in DOM
   * @return {?} the value for the input
   */
  getFilterOptionValue(id) {
    let value = false;

    const optionMap = {
      inQueue: this.props.filterOptions.inQueue,
      notInQueue: this.props.filterOptions.notInQueue,
      collected: this.props.filterOptions.collected,
      notCollected: this.props.filterOptions.notCollected,
      filterText: this.props.filterOptions.text
    };

    value = optionMap[id];

    return value;
  }


  /**
   * Calculates the grid width
   *
   * return {number} width in pixels
   */
  calcGridWidth() {
    // We know that the side menu is fixed width 65px and that the padding from
    // bootstrap is 15px so content starts at 80px;

    // Get the viewportWidth
    const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);

    // The full content width for this media (not forgeting the padding to the right 15px)
    const fullContentWidth = viewportWidth - 80 - 15;

    // Each sample item is 190px wide, calculate maximum number of items for each row
    const numCols = Math.floor(fullContentWidth / SAMPLE_ITEM_WIDTH);

    // Caculating the actual grid size, with space between sample items;
    const actualGridWidth = numCols * (SAMPLE_ITEM_WIDTH + 2 + SAMPLE_ITEM_SPACE) + 10;

    return [actualGridWidth, numCols];
  }


  /**
   * Resizes the grid container element (with id smapleGridContainer)
   */
  resizeGridContainer() {
    const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const width = Math.min(viewportWidth, this.calcGridWidth()[0] || 0);
    document.getElementById('sampleGridContainer').style.width = `${width - 38}px`;
  }


  /**
   * Helper function that displays a task form
   *
   * @param {string} formName - [Characterisation, DataCollection, AddSample]
   * @property {Object} selected
   * @property {Object} sampleList
   */
  showTaskForm(formName, wf = {}) {
    let prefix = '';
    let path = '';

    if (Object.keys(this.props.selected).length === 1) {
      prefix = this.props.sampleList[Object.keys(this.props.selected)[0]].defaultPrefix;
      path = this.props.sampleList[Object.keys(this.props.selected)[0]].sampleName;
    }

    const parameters = { parameters: {
      ...this.props.defaultParameters[formName.toLowerCase()],
      ...wf,
      prefix,
      path } };

    const selected = [];

    for (const sampleID in this.props.selected) {
      if (this.props.selected[sampleID]) {
        selected.push(sampleID);
      }
    }

    if (formName === 'AddSample') {
      this.props.showTaskParametersForm('AddSample');
    } else {
      this.props.showTaskParametersForm(formName, selected, parameters);
    }
  }


  /**
   * Synchronises samples with ISPyB
   *
   * @property {Object} loginData
   */
  syncSamples() {
    let proposalId;

    try {
      proposalId = this.props.loginData.Proposal.proposalId;
    } catch (e) {
      return;
    }

    this.props.syncSamples(proposalId);
  }


  /**
   * @return {boolean} true if any filter option is used
   */
  filterIsUsed() {
    return (this.props.filterOptions.inQueue ||
            this.props.filterOptions.notInQueue ||
            this.props.filterOptions.collected ||
            this.props.filterOptions.notCollected ||
            (this.props.filterOptions.text.length > 0));
  }


  /**
   * Applies filter defined by user
   */
  sampleGridFilter(e) {
    const optionMap = {
      inQueue: { inQueue: e.target.checked },
      notInQueue: { notInQueue: e.target.checked },
      collected: { collected: e.target.checked },
      notCollected: { notCollected: e.target.checked },
      filterText: { text: ReactDOM.findDOMNode(this.filterInput).value.trim() }
    };

    this.props.filter(optionMap[e.target.id]);
  }


  /**
   *  Clears the filter
   */
  sampleGridClearFilter() {
    this.props.filter({ inQueue: false,
                        notInQueue: false,
                        collected: false,
                        notCollected: false,
                        filterText: '' });
  }


  /**
   * @return {number} number of sammples in queue
   */
  numSamplesPicked() {
    return Object.keys(this.props.queue.queue).length;
  }


  /**
   * @return {boolean} true if collect should be disabled otherwise false
   */
  isCollectDisabled() {
    return this.numSamplesPicked() === 0;
  }


  /**
   * Checks if sample with sampleID is in queue
   *
   * @param {string} sampleID
   * @property {Object} queue
   * @return {boolean} true if sample with sampleID is in queue otherwise false
   */
  inQueue(sampleID) {
    return this.props.queue.queue.includes(sampleID);
  }


  /**
   * Adds samples with sampleIDs in sampleIDList, removes the samples if they
   * are already in the queue.
   *
   * @param {array} sampleIDList - array of sampleIDs to add or remove
   */
  inQueueDeleteElseAddSamples(sampleIDList) {
    const samples = [];
    const samplesToRemove = [];
    for (const sampleID of sampleIDList) {
      if (this.inQueue(sampleID)) {
        samplesToRemove.push(sampleID);
      } else {
        samples.push(sampleID);
      }
    }

    if (samplesToRemove.length > 0) { this.props.deleteSamplesFromQueue(samplesToRemove); }
    if (samples.length > 0) { this.addSamplesToQueue(samples); }
  }


  /**
   * Removes selected samples
   */
  removeSelectedSamples() {
    for (const sampleID of Object.keys(this.props.selected)) {
      if (this.inQueue(sampleID)) {
        this.props.deleteSamplesFromQueue([sampleID]);
      }
    }
  }


  /**
   * @returns {number} total number of samples
   */
  numSamples() {
    return Object.keys(this.props.sampleList).length;
  }


  /**
   * Selects all samples
   */
  selectAllSamples() {
    this.props.selectSamples(Object.keys(this.props.sampleList));
  }


  /**
   * Un-selects all samples
   */
  clearSelectedSamples() {
    this.props.selectSamples(Object.keys(this.props.sampleList), false);
  }


  /**
   * Adds samples in sampleIDList to queue
   *
   * @param {array} sampleIDList - array of sampleIDs to add
   */
  addSamplesToQueue(sampleIDList) {
    const samplesToAdd = sampleIDList.map((sampleID) => {
      const sample = { ...this.props.sampleList[sampleID], checked: true, tasks: [] };
      return sample;
    });

    if (samplesToAdd.length > 0) { this.props.addSamplesToQueue(samplesToAdd); }
  }


  /**
   * Adds all selected samples to queue
   */
  addSelectedSamplesToQueue() {
    this.addSamplesToQueue(Object.keys(this.props.selected));
  }


  /**
   * Start collection
   */
  startCollect() {
    this.props.router.push('datacollection');
    this.props.showConfirmCollectDialog();
  }


  /**
   * Collect button markup
   */
  collectButton() {
    const collectText = `Collect ${this.numSamplesPicked()}/${this.numSamples()}`;

    let button = (
      <Button
        className="btn btn-success pull-right"
        onClick={this.startCollect}
        disabled={this.isCollectDisabled()}
      >
        {collectText}
        <Glyphicon glyph="chevron-right" />
      </Button>);

    if (this.props.queue.queueStatus === QUEUE_RUNNING) {
      button = (
        <Button className="btn btn-danger pull-right" >
          <b> Stop queue </b>
        </Button>);
    }

    return button;
  }


  render() {
    const innerSearchIcon = (
      <DropdownButton componentClass={InputGroup.Button} title="" id="filter-drop-down">
        <div style={{ padding: '1em', width: '300px' }}>
          <b>Filter: </b>
        <Row>
          <Col xs={12}>
            <div style={{ margin: '1em 0em' }}>
              <Row>
                <Col xs={12}>
                  <Row>
                    <Col xs={6}>
                      <Checkbox
                        id="inQueue"
                        inline
                        checked={this.getFilterOptionValue('inQueue')}
                        onChange={this.sampleGridFilter}
                      >
                        In Queue
                      </Checkbox>
                  </Col>
                  <Col xs={6}>
                    <Checkbox inline
                      id="notInQueue"
                      checked={this.getFilterOptionValue('notInQueue')}
                      onChange={this.sampleGridFilter}
                    >
                      Not in Queue
                    </Checkbox>
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col xs={12}>
                <Row>
                  <Col xs={6}>
                    <Checkbox
                      inline
                      id="collected"
                      checked={this.getFilterOptionValue('collected')}
                      onChange={this.sampleGridFilter}
                    >
                      Collected
                    </Checkbox>
                  </Col>
                  <Col xs={6}>
                    <Checkbox
                      inline
                      id="notCollected"
                      checked={this.getFilterOptionValue('notCollected')}
                      onChange={this.sampleGridFilter}
                    >
                      Not Collected
                    </Checkbox>
                  </Col>
                </Row>
              </Col>
            </Row>
            </div>
            <div className="pull-right">
              <Button onClick={this.sampleGridClearFilter}>
                Clear
              </Button>
            </div>
          </Col>
        </Row>
        </div>
      </DropdownButton>
    );

    return (
      <StickyContainer>
        <div id="sampleGridContainer" className="samples-grid-container">
          <ConfirmActionDialog
            title="Clear sample grid ?"
            message="This will remove all samples (and collections) from the grid,
                     are you sure you would like to continue ?"
            onOk={this.props.sendClearQueue}
            show={this.props.showConfirmClearQueueDialog}
            hide={this.props.confirmClearQueueHide}
          />
          <Sticky
            style={{ zIndex: 1000, transform: '' }}
            stickyStyle={{ zIndex: 1000,
                           paddingTop: '65px',
                           paddingBottom: '0.5em',
                           paddingLeft: '1em',
                           paddingRight: '1em',
                           borderBottom: '1px solid #CCC',
                           backgroundColor: '#FAFAFA',
                           width: '100%',
                           left: '0px' }}
          >
            <Row>
              <Col xs={4}>
                <Form inline>
                  <SplitButton
                    id="split-button-sample-changer-selection"
                    disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                    title={'Get samples from SC'}
                    onClick={this.props.getSamples}
                  >
                    <MenuItem eventKey="2" onClick={this.showAddSampleForm}>
                      Create new sample
                    </MenuItem>
                  </SplitButton>
                  <span style={{ marginLeft: '1em' }} />
                  <OverlayTrigger
                    placement="bottom"
                    overlay={(
                      <Tooltip id="select-samples">
                        Synchronise sample list with ISPyB
                      </Tooltip>)}
                  >
                    <Button onClick={this.syncSamples}>
                      <Glyphicon glyph="refresh" /> ISPyB
                    </Button>
                  </OverlayTrigger>
                  <span style={{ marginLeft: '1em' }} />
                  <OverlayTrigger
                    placement="bottom"
                    overlay={(
                      <Tooltip id="select-samples">
                        Remove all samples from sample list and queue
                      </Tooltip>)}
                  >
                    <Button
                      onClick={this.props.confirmClearQueueShow}
                      disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                    >
                      Clear sample list
                    </Button>
                  </OverlayTrigger>
                </Form>
              </Col>
              <Col xs={7}>
                <Form inline>
                  <FormGroup>
                    <ControlLabel>Filter: &nbsp;</ControlLabel>
                    <InputGroup className={this.filterIsUsed() ? 'filter-input-active' : ''}>
                      <FormControl
                        id="filterText"
                        type="text"
                        ref={(input) => { this.filterInput = input; }}
                        defaultValue={this.props.filterOptions.text}
                        onChange={this.sampleGridFilter}
                      />
                      {innerSearchIcon}
                    </InputGroup>
                  </FormGroup>
                </Form>
                <span style={{ marginLeft: '1em' }} />
                <Form inline>
                  <SplitButton
                    id="pipeline-mode-dropdown"
                    disabled={this.props.queue.queueStatus === QUEUE_RUNNING}
                    onClick={this.addSelectedSamplesToQueue}
                    title={<span><Glyphicon glyph="plus" /> En-queue sample</span>}
                  >
                    <MenuItem eventKey="2" onClick={this.showDataCollectionForm}>
                      Add Data collection
                    </MenuItem>
                    <MenuItem eventKey="3" onClick={this.showCharacterisationForm}>
                      Add Characterisation
                    </MenuItem>
                  </SplitButton>
                </Form>
              </Col>
              <Col xs={1} className="pull-right">
                {this.collectButton()}
              </Col>
            </Row>
          </Sticky>
          <p></p>
          <SampleGridContainer
            addSelectedSamplesToQueue={this.addSelectedSamplesToQueue}
            showCharacterisationForm={this.showCharacterisationForm}
            showDataCollectionForm={this.showDataCollectionForm}
            showWorkflowForm={this.showWorkflowForm}
            addSamplesToQueue={this.addSamplesToQueue}
            inQueue={this.inQueue}
            inQueueDeleteElseAddSamples={this.inQueueDeleteElseAddSamples}
            removeSelectedSamples={this.removeSelectedSamples}
            gridWidth={this.calcGridWidth()}
          />
        </div>
      </StickyContainer>
    );
  }
}


/**
 * @property {Object} loginData - current user data
 * @property {Object} sampleList - list of samples
 * @property {array} queue - samples in queue
 * @property {object} selected - contains samples that are currentl selected
 * @property {object} defaultParameters - default task parameters
 * @property {object} filterOptions - current filter options
 * @property {boolean} showConfirmClearQueue
 */
function mapStateToProps(state) {
  return {
    loginData: state.login.data,
    queue: state.queue,
    selected: state.sampleGrid.selected,
    sampleList: state.sampleGrid.sampleList,
    defaultParameters: state.taskForm.defaultParameters,
    filterOptions: state.sampleGrid.filterOptions,
    showConfirmClearQueueDialog: state.general.showConfirmClearQueueDialog
  };
}


function mapDispatchToProps(dispatch) {
  return {
    getSamples: () => dispatch(sendGetSampleList()),
    filter: (filterOptions) => dispatch(filterAction(filterOptions)),
    syncSamples: (proposalId) => dispatch(sendSyncSamples(proposalId)),
    showTaskParametersForm: bindActionCreators(showTaskForm, dispatch),
    selectSamples: (keys, selected) => dispatch(selectSamplesAction(keys, selected)),
    deleteSamplesFromQueue: (sampleID) => dispatch(deleteSamplesFromQueue(sampleID)),
    sendClearQueue: () => dispatch(sendClearQueue()),
    addSamplesToQueue: (sampleData) => dispatch(addSamplesToQueue(sampleData)),
    confirmClearQueueShow: bindActionCreators(showConfirmClearQueueDialog, dispatch),
    confirmClearQueueHide:
      bindActionCreators(showConfirmClearQueueDialog.bind(this, false), dispatch),
    showConfirmCollectDialog: bindActionCreators(showConfirmCollectDialog, dispatch)
  };
}

SampleGridViewContainer = withRouter(SampleGridViewContainer);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SampleGridViewContainer);

