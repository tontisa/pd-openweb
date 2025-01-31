import sheetAjax from 'src/api/worksheet';
import { controlState } from 'src/components/newCustomFields/tools/utils';

const getPermissionInfo = (controlId, rowInfo, worksheet) => {
  const { allowAdd } = worksheet;
  const { receiveControls, allowEdit } = rowInfo;
  const activeSheetIndex = 0;
  const relateSheetControls = receiveControls.filter(
    control => (control.type === 29 && control.enumDefault === 2) || control.type === 34,
  );
  const activeRelateSheetControl = _.find(relateSheetControls, { controlId }) || {};
  const controlPermission = controlState(activeRelateSheetControl);
  const { enumDefault2, strDefault, controlPermissions = '111' } = activeRelateSheetControl;
  const [, , onlyRelateByScanCode] = strDefault.split('').map(b => !!+b);
  const isSubList = activeRelateSheetControl.type === 34;
  const isCreate = isSubList
    ? allowEdit && controlPermission.editable && enumDefault2 !== 1 && enumDefault2 !== 11 && !onlyRelateByScanCode
    : allowEdit &&
      controlPermission.editable &&
      allowAdd &&
      enumDefault2 !== 1 &&
      enumDefault2 !== 11 &&
      !onlyRelateByScanCode;
  const isRelevance =
    !isSubList &&
    controlPermission.editable &&
    enumDefault2 !== 10 &&
    enumDefault2 !== 11 &&
    allowEdit &&
    !onlyRelateByScanCode;
  const hasEdit = controlPermission.editable && allowEdit && (allowAdd || isSubList);
  const isWxWork = false;
  const isWeLink = window.navigator.userAgent.toLowerCase().includes('huawei-anyoffice');

  return {
    isCreate,
    isRelevance,
    hasEdit,
    isSubList,
    activeRelateSheetControl,
    controlPermission,
    onlyRelateByScanCode: onlyRelateByScanCode && (isWxWork || isWeLink),
  };
}

export const updateBase = base => (dispatch, getState) => {
  dispatch({
    type: 'MOBILE_UPDATE_BASE',
    base,
  });
}

export const loadRow = () => (dispatch, getState) => {

  const { base, rowInfo } = getState().mobile;
  const { instanceId, workId, worksheetId, rowId } = base;
  const params = {};

  if (instanceId && workId) {
    params.instanceId = instanceId;
    params.workId = workId;
    params.rowId = rowId;
    params.worksheetId = worksheetId;
    params.getType = 9;
  } else {
    const { appId, viewId, controlId } = base;
    params.controlId = controlId;
    params.getType = 1;
    params.checkView = true;
    params.appId = appId;
    params.worksheetId = worksheetId;
    params.viewId = viewId;
    params.rowId = rowId;
  }

  if (_.isEmpty(rowInfo)) {
    sheetAjax.getRowByID(params).then(result => {
      dispatch({ type: 'MOBILE_RELATION_ROW_INFO', data: result });
      dispatch(loadRowRelationRows());
    });
  } else {
    dispatch(loadRowRelationRows());
  }
}

export const loadRowRelationRows = () => (dispatch, getState) => {

  const { base, loadParams, relationRows, rowInfo } = getState().mobile;
  const { pageIndex } = loadParams;
  const { instanceId, rowId, worksheetId, controlId } = base;
  const PAGE_SIZE = 10;
  const params = {
    controlId,
    rowId,
    worksheetId
  };
  
  dispatch({ type: 'MOBILE_RELATION_LOAD_PARAMS', data: { loading: true } });

  if (_.isEmpty(instanceId)) {
    const { appId, viewId } = base;
    params.appId = appId;
    params.viewId = viewId;
  }

  sheetAjax.getRowRelationRows({
    ...params,
    pageIndex,
    pageSize: PAGE_SIZE,
    getWorksheet: pageIndex === 1,
  }).then(result => {
    if (pageIndex === 1) {
      const { controls } = result.template;
      const control = _.find(rowInfo.receiveControls, { controlId });
      const titleControl = _.find(controls, { attribute: 1 });
      const fileControls = controls.filter(item => item.type === 14);
      dispatch({
        type: 'MOBILE_RELATION_ROW',
        data: _.pick(result, ['template', 'worksheet', 'count'])
      });
      dispatch({
        type: 'MOBILE_PERMISSION_INFO',
        data: getPermissionInfo(controlId, rowInfo, result.worksheet)
      });
      dispatch({
        type: 'MOBILE_RELATION_ACTION_PARAMS',
        data: {
          showControls: control.showControls.filter(item => titleControl.controlId !== item).slice(0, 3),
          coverCid: fileControls.length ? fileControls[0].controlId : null,
        }
      });
    }
    dispatch({
      type: 'MOBILE_RELATION_ROWS',
      data: relationRows.concat(result.data)
    });
    dispatch({
      type: 'MOBILE_RELATION_LOAD_PARAMS',
      data: {
        pageIndex,
        loading: false,
        isMore: result.data.length === PAGE_SIZE
      }
    });
  });
}

export const updateRelationRows = (data, value) => (dispatch, getState) => {
  const { relationRow } = getState().mobile;
  dispatch({
    type: 'MOBILE_RELATION_ROWS',
    data
  });
  dispatch({
    type: 'MOBILE_RELATION_ROW',
    data: {
      count: relationRow.count + value
    }
  });
}

export const updatePageIndex = (index) => (dispatch, getState) => {
  dispatch({
    type: 'MOBILE_RELATION_LOAD_PARAMS',
    data: { pageIndex: index }
  });
  dispatch(loadRowRelationRows());
}

export const updateActionParams = (data) => (dispatch, getState) => {
  dispatch({
    type: 'MOBILE_RELATION_ACTION_PARAMS',
    data
  });
}

export const reset = () => (dispatch, getState) => {
  dispatch({
    type: 'MOBILE_RELATION_LOAD_PARAMS',
    data: {
      pageIndex: 1,
      loading: true,
      isMore: true
    }
  });
  dispatch({
    type: 'MOBILE_RELATION_ACTION_PARAMS',
    data: {
      isEdit: false,
      selectedRecordIds: []
    }
  });
  dispatch({
    type: 'MOBILE_RELATION_ROW_INFO', data: {}
  });
  dispatch({
    type: 'MOBILE_RELATION_ROWS',
    data: []
  });
  dispatch({
    type: 'MOBILE_RELATION_ROW',
    data: { count: 0 }
  });
}

