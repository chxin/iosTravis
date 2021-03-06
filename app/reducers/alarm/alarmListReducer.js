'use strict';


import {
  ALARM_LOAD_SUCCESS,
  ALARM_LOAD_REQUEST,
  ALARM_LOAD_FAILURE,
  ALARM_FILTER_DIDCHANGED,
} from '../../actions/alarmAction';

// import {LOGOUT_SUCCESS} from '../../actions/loginAction.js';
import {commonReducer} from '../commonReducer.js';

import Immutable from 'immutable';


var defaultState = Immutable.fromJS({
  data:null,
  pageCount:0,
  isFetching:false,
  sectionData:null,
  allDatas:null,
  isContrainUnresolvedAlarm:false,
});

function categoryAllDatas(state)
{
  var newState = state;
  var Items = newState.get('data');

  var listStatus1 = [];
  var listStatus2 = [];
  Items.forEach((item)=>{
    if (!item.get('SecureTime')) {
      listStatus1.push(item);
    }else{
      listStatus2.push(item);
    }
  });
  var sectionTitle = [];
  var allDatas = [];
  if (listStatus1.length>0) {
    allDatas.push(listStatus1);
    sectionTitle.push('未解除');
  }
  let isContrainUnresolvedAlarm=false;
  if (sectionTitle.length>0) {
    isContrainUnresolvedAlarm=true;
  }
  if (listStatus2.length>0) {
    allDatas.push(listStatus2);
    sectionTitle.push('已解除');
  }
  // console.warn('categoryAllDatas',allDatas);
  newState=newState.set('sectionData',Immutable.fromJS(sectionTitle)).set('allDatas',Immutable.fromJS(allDatas))
  .set('isContrainUnresolvedAlarm',isContrainUnresolvedAlarm);
  return newState;
}

function mergeData(state,action) {
  var response = action.response.Result;
  var newState = state;
  var page = action.body.CurrentPage;

  var items = response.Items;
  items.forEach((item)=>{
    item.Status.push({'Timestamp':item.AlarmTime, 'Content':'发生报警',User:'self'});
    if (!!item.SecureTime) {
      item.Status.unshift({'Timestamp':item.SecureTime, 'Content':'报警已解除，现场数据已正常',User:'self'});
    }
  })

  if(page === 1){
    newState = newState.set('data',Immutable.fromJS(response.Items));
  }
  else {
    var oldData = newState.get('data');
    var newList = Immutable.fromJS(response.Items);
    newList = oldData.push(...newList.toArray());
    newState = newState.set('data',newList);
  }
  console.warn('alarmListReducer...',page,newState.get('data').size);
  newState = categoryAllDatas(newState);

  newState = newState.set('pageCount',response.PageCount);
  newState = newState.set('isFetching',false);

  return newState;
}

function handleError(state,action) {
  var {Error} = action.error;
  // console.warn('handleError',action);

  switch (Error) {
    case '040001307022':
      action.error = '您没有这一项的操作权限，请联系系统管理员';
      state=state.set('data',Immutable.fromJS([]));
      break;
  }
  return state.set('isFetching',false).set('sectionData',null).set('allDatas',null);
}



export default commonReducer((state,action)=>{

  switch (action.type) {
    case ALARM_FILTER_DIDCHANGED:
      return state.set('isFetching',true);
    case ALARM_LOAD_REQUEST:
      return state.set('isFetching',true);
    case ALARM_LOAD_SUCCESS:
      return mergeData(state,action);
    case ALARM_LOAD_FAILURE:
      return handleError(state,action);
    default:

  }
  return state;
},defaultState);
