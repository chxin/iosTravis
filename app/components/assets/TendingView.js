
'use strict';
import React,{Component,PropTypes} from 'react';

import {
  View,
  // ListView,
  // InteractionManager,
} from 'react-native';

import Toolbar from '../Toolbar';

import List from '../List.js';
import TendingRow from './TendingRow.js';

export default class TendingView extends Component{
  constructor(props){
    super(props);

  }
  _renderRow(rowData,sectionId,rowId){
    return (
      <TendingRow rowData={rowData} onRowClick={this.props.onRowClick} />
    );
  }
  _getToolbar(){
    return (
      <Toolbar
        title={this.props.title}
        navIcon="back"
        onIconClicked={this.props.onBack}
        onActionSelected={[this.props.createLog]} />
    );
  }
  render() {
    return (
      <View style={{flex:1,backgroundColor:'white'}}>
        {this._getToolbar()}
        <List
          isFetching={this.props.isFetching}
          onRefresh={this.props.onRefresh}
          listData={this.props.tickets}
          currentPage={null}
          totalPage={null}
          emptyText={this.props.emptyText}
          renderRow={(rowData,sectionId,rowId)=>this._renderRow(rowData,sectionId,rowId)}
        />
      </View>
    );
  }
}

TendingView.propTypes = {
  user:PropTypes.object,
  isFetching:PropTypes.bool,
  onRowClick:PropTypes.func.isRequired,
  onRefresh:PropTypes.func.isRequired,
  tickets:PropTypes.object,
  emptyText:PropTypes.string.isRequired,
  onBack:PropTypes.func.isRequired,
  title:PropTypes.string.isRequired,
}
