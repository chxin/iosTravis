'use strict';

import {
  DEVICE_SETTING_REQUEST,
  DEVICE_SETTING_SUCCESS,
  DEVICE_SETTING_FAILURE,
  MAINTEN_SELECT_CHANGED,
  DEVICE_EXIT,
} from '../../actions/assetsAction.js';

import {LOGOUT_SUCCESS} from '../../actions/loginAction.js';

import Immutable from 'immutable';

import {round} from 'lodash/math';

var defaultState = Immutable.fromJS({
  data:null,
  deviceId:null,
  sectionData:[],
  imageId:null,
  isFetching:false,
  strTkdyly:null,
  isCommonDevice:true
});

function combineUnit(value,unit) {
  var val = parseFloat(value);
  if (!value) {
    return '--';
  }
  if (isNaN(val)) {
    var lowerValue=value.toLowerCase().replace(/(^\s*)|(\s*$)/g, "");
    if (lowerValue.indexOf('null')>=0||lowerValue.indexOf('nan')>=0||lowerValue==='-'||lowerValue==='--'||lowerValue==='') {
      return '--';
    }
  }
  if (isNaN(value)) {
    return value;
  }
  else {
    if (unit==='次') {
      return round(val,0)+unit;
    }
    var resVal=val;
    if(val.toString().indexOf('.')>0||val.toString().indexOf('e')>0){
      resVal=round(val,2);
      resVal=parseFloat(resVal);
      if (Math.abs(val)>=10) {
        resVal=round(val,1);
        resVal=parseFloat(resVal);
      }
    }
    return resVal+unit;
  }
}

function resetDeviceRuntimeInfo(state,action)
{
  return defaultState;
}

function generateImageId(state,params) {
  var newState = state;
  if(params && params.length > 0){
    var curve = params[0]['TrippingCurve'];
    var type = curve.split('-')[0];
    var imageId = `DeviceSettingParameters-Curve-${type}`;
    return newState.set('imageId',imageId);
  }

  return newState;
}
function maintenParaSelectInfoChange(state,action){
  var newState = state;
  var {data:{value}} = action;
  var sectionData = newState.get('sectionData');
  var index = sectionData.findIndex((item)=>item.get('title')===value.get('title'));
  sectionData = sectionData.update(index,(item)=>{
    if(!item.get('isExpanded'))
    {
      item = item.set('isExpanded',true);
    }else {
      item = item.set('isExpanded',false)
    }
    return item;
  });
  newState = newState.set('sectionData', sectionData);

  var response=newState.get('cacheResponse');
  if (response) {
    newState=categoryDatas(newState,response);
  }
  return newState;
}
function getOldSecExpandedValue(state,title)
{
  var sectionData = state.get('sectionData');
  var index = sectionData.findIndex((item)=>item.get('title')===title);
  if (index===-1) {
    return null;
  }
  return sectionData.get(index);
}

function isValilable(value,params)
{
  if (!params || params.size === 0) {
      return false;
    } else {
      var val = parseFloat(value);
      if(isNaN(val)){
        return false;
      }
      return true;
    }
}

function categoryDatas(state,response)
{
  var data = [];
  var newSecData = [];
  var AgingData=response.AgingData;
  var status=AgingData.State;
  if (AgingData&&status!==0&&status!==-3&&status!==-7) {
    var errStr=null;
    switch (status) {
      case -1:
        errStr='该型号的断路器不支持老化参数计算';
        break;
      case -2:
        errStr='环境参数配置不全，请检查断路器所在配电柜信息的【环境参数】';
        break;
      case -4:
        errStr='断路器负载率运行时间为无效值，请检查断路器的【维护参数】';
        break;
      case -5:
        errStr='断路器老化参数计算初始化异常';
        break;
      case -6:
        errStr='断路器老化参数计算出现异常';
        break;
      case -8:
        errStr='断路器触头磨损率为无效值，请检查断路器的【维护参数】';
        break;
      default:
        errStr=null;
    }
    var settDatas=[];
    settDatas.push({
      title:'AgingData',
      value:response.AgingData.Aging,
      isNav:false,
      errStr
    });
    data.push(settDatas);
    newSecData.push({title:'设备老化参数计算',isExpanded:null});
  }

  var aValue=null;
  var bValue=null;
  var cValue=null;
  var isContainIrPoint=null;
  // if(response.SettingParameters){
    if(response.MaintenanceParameterGroups){
      response.MaintenanceParameterGroups.map((itemGroup,index)=>{
        if (itemGroup&&itemGroup.MaintenanceParameters&&itemGroup.MaintenanceParameters.length>0) {
          itemGroup.MaintenanceParameters.map((item)=>{
            if (item.Name.indexOf('A相电流最大需量')>=0) {
              aValue=true;
              // aValue=combineUnit(item.FinVal,item.Unit);
              // if (item.FinVal==='-') {
              //   aValue=null;
              // }
            }else if (item.Name.indexOf('B相电流最大需量')>=0) {
              bValue=true;
              // bValue=combineUnit(item.FinVal,item.Unit);
              // if (item.FinVal==='-') {
              //   bValue=null;
              // }
            }else if (item.Name.indexOf('C相电流最大需量')>=0) {
              cValue=true;
              // cValue=combineUnit(item.FinVal,item.Unit);
              // if (item.FinVal==='-') {
              //   cValue=null;
              // }
            }else if (item.Name.indexOf('长延时保护电流')>=0) {
              isContainIrPoint=true;
            }
          });
        }
      });
    }
  // }
  var vIrValue='';
  response.SettingParameters.map((item)=>{
    if (item.Name.indexOf('长延时保护电流')>=0) {
      isContainIrPoint=true;
      vIrValue=item.Value;
    }
  });

  var itemRatio=null;
  var demandRatio=response.DemandRequestRatio?Math.round(response.DemandRequestRatio*100):null;
  demandRatio=demandRatio>100?100:demandRatio;
  var bigOrSmallStr=demandRatio>=80?'过小':(demandRatio<=30?'过大':null);
  var errStr=null;
  // console.warn('valiable...',isValilable(vIrValue,response.SettingParameters),isValilable(response.DemandRequestRatio,response.SettingParameters),response.DemandRequestRatio);
  if (isValilable(vIrValue,response.SettingParameters)) {
    if (isValilable(response.DemandRequestRatio,response.SettingParameters)) {
      errStr=bigOrSmallStr?'长延时保护电流(lr)设定'+bigOrSmallStr:null;
    }else {
      errStr=null;
    }
  }else {
    if (response.DemandRequestRatio==='') {
      errStr=vIrValue===''?'长延时保护电流(lr)为空':'长延时保护电流(lr)为无效值';
    }
  }
  if (aValue||bValue||cValue) {
    itemRatio={
      title:'DemandRequestRatio',
      value:demandRatio,
      isNav:false,
      errStr
    };
  }else {
    itemRatio={
      title:'DemandRequestRatio',
      value:demandRatio,
      isNav:false,
      errStr:null
    };
  }

  if(response.SettingParameters){
    var abcDatas=[];
    if(response.MaintenanceParameterGroups){
      response.MaintenanceParameterGroups.map((itemGroup,index)=>{
        // console.warn('index',index,itemGroup.GroupName);
        if (itemGroup&&itemGroup.MaintenanceParameters&&itemGroup.MaintenanceParameters.length>0) {
          itemGroup.MaintenanceParameters.map((item)=>{
            if (item.Name.indexOf('相电流最大需量')>=0) {
              abcDatas.push({
                title:item.Name,
                value:combineUnit(item.FinVal,item.Unit),
                isNav:false
              });
            }
          });
        }
      });
    }
    abcDatas.sort(function(x,y){
      return x.title>y.title?1:-1;
    })
    var settDatas=[];
    response.SettingParameters.map((item)=>{
      settDatas.push({
        title:item.Name,
        value:combineUnit(item.Value,item.Unit),
        isNav:false
      });
    });
    var arrSetts=[];
    // var arrSetts=[...abcDatas,...settDatas,{
    //   title:'image',
    //   value:'image',
    //   isNav:false
    // }];

    var isCommonDevice=state.get('isCommonDevice');
    var isCombox510Device=state.get('isCombox510Device');
    if (abcDatas.length>0&&isContainIrPoint&&isCommonDevice) {
      arrSetts.push(...abcDatas);
    }
    arrSetts.push(...settDatas);
    arrSetts.push({
      title:'image',
      value:'image',
      isNav:false
    });
    // console.warn('abc value',aValue,bValue,cValue,isContainIrPoint,isCommonDevice,abcDatas.length);
    if ((aValue!==null||bValue!==null||cValue!==null)&&isContainIrPoint) {
      if (isCommonDevice) {
        arrSetts.splice(0,0,itemRatio);
      }
    }
    // var isCombox510Device=JoinType===2;
    if ((settDatas.length>0||abcDatas.length>0)&&!isCombox510Device) {
      data.push(arrSetts);
      var strTkdyly=state.get('strTkdyly');
      var strTitle='需量与保护定值比';
      if (abcDatas.length>0&&isContainIrPoint&&isCommonDevice) {
        strTitle='需量与保护定值比';
      }else {
        if (strTkdyly&&strTkdyly.length>0) {
          strTitle='保护设定值'+'-'+strTkdyly;
        }
      }
      newSecData.push({title:strTitle,isExpanded:null});
    }
  }

  if(response.MaintenanceParameterGroups){
    var isFirst=true;
    response.MaintenanceParameterGroups.map((itemGroup,index)=>{
      // console.warn('index',index,itemGroup.GroupName);
      if (itemGroup.GroupName&&itemGroup.GroupName.length>0) {
        var oldSecData=getOldSecExpandedValue(state,itemGroup.GroupName);
        var tempExpanded=false;
        if (oldSecData) {
          tempExpanded=oldSecData.get('isExpanded');
          newSecData.push({title:itemGroup.GroupName,isExpanded:tempExpanded});
        }else {
          tempExpanded=isFirst;
          newSecData.push({title:itemGroup.GroupName,isExpanded:isFirst});
          isFirst=false;
        }
        var arrItems=itemGroup.MaintenanceParameters.map((item)=>{
          return {
            title:item.Name,
            value:combineUnit(item.FinVal,item.Unit),
            isNav:false
          }
        });
        if (!tempExpanded) {
          data.push([]);
        }else {
          data.push(arrItems);
        }
      }
    });
  }
  state = state.set('data',Immutable.fromJS(data));
  state = state.set('sectionData',Immutable.fromJS(newSecData));
  state = state.set('isFetching',false);

  return state;
}

function updateData(state,action) {
  var {data:{deviceId,datas,isCombox510Device},response:{Result}} = action;
  var strTkdyly=datas.strTkdy;
  var isCommonDevice=datas.isCommonDevice;
  var isCombox510Device=datas.isCombox510Device;
  // console.warn('reducer...',strTkdyly,isCommonDevice,datas.isCombox510Device);
  var response = Result;
  var newState=state.set('strTkdyly',strTkdyly);
  newState=newState.set('isCommonDevice',isCommonDevice).set('isCombox510Device',isCombox510Device);
  newState=categoryDatas(newState,response);
  newState = newState.set('deviceId',deviceId);

  newState = generateImageId(newState,response.SettingParameters);
  newState=newState.set('cacheResponse',response);
  return newState;
}

function handleFetching(state,action) {
  var data = state.get('data');
  //第一次数据未返回时，要展示loading，当数据出现后，不在用loading刷新
  if(data && data.size > 0){
    return state;
  }
  else {
    return state.set('isFetching',true);
  }
}

function handleError(state,action) {
  // var {Result} = action.error;
  // if(!Result){
  //   action.error = '无相关权限';
  // }

  return state.set('isFetching',false);
}

export default function(state=defaultState,action){

  switch (action.type) {
    case DEVICE_SETTING_REQUEST:
      return handleFetching(state,action);
    case DEVICE_SETTING_SUCCESS:
      return updateData(state,action);
    case DEVICE_SETTING_FAILURE:
      return handleError(state,action);
    case MAINTEN_SELECT_CHANGED:
      return maintenParaSelectInfoChange(state,action);
    case DEVICE_EXIT:
      return resetDeviceRuntimeInfo(state,action);
    case LOGOUT_SUCCESS:
      return defaultState;
    default:

  }
  return state;
}
