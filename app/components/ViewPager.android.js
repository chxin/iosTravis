
'use strict';
import React,{Component,PropTypes} from 'react';

import {
  View,
  ViewPagerAndroid
  // Alert
} from 'react-native';


// console.warn('ViewPager',ViewPager);

export default class ViewPager extends Component{
  constructor(props){
    super(props);
    this.state = {index:props.initialPage};
    this._cache = {};
  }
  _renderPage(index){
    if(this._cache[index]){
      return this._cache[index];
    }
    var component = this.props.renderPage(index,this.state.index);
    if(component){
      this._cache[index] = component;
    }
    return component;
  }
  setPage(index){
    this._viewPager.setPage(index);
    // this.setState({index});
  }
  componentWillReceiveProps(nextProps) {
    // if(nextProps.initialPage !== this.state.index){
    //   this.setState({index:nextProps.initialPage});
    // }
  }
  render() {
    return (
      <ViewPagerAndroid
        ref={(viewPager)=>this._viewPager = viewPager}
        scrollEnabled={false}
        style={{flex:1}} {...this.props}>
        {
          new Array(this.props.totalPage).fill(0).map((item,index)=>{
            return (
              <View key={index}>
                {this._renderPage(index)}
              </View>
            )
          })
        }
      </ViewPagerAndroid>
    );
  }
}

ViewPager.propTypes = {
  children:PropTypes.array,
  totalPage:PropTypes.number,
  renderPage:PropTypes.func.isRequired,
}
