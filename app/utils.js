function classNames(classes) {
  var cs = '';
  for (var i in classes) {
    cs += (classes[i]) ? i + ' ' : '';
  }
  return cs.trim();
}
/**
 * [bSearch description]
 * @param  {[Array]} arr    sorted array
 * @param  {[Any]} target   [description]
 * @param  {[Function]} compareFn(target, item){} return -1, 0, 1
 * @return {[Integer]}           index in arr
 */
function bSearch(arr, target, compareFn){
  if(arr.length === 0) return -1;
  return _rBSearch(arr, target, compareFn, 0, arr.length - 1);
}

function _rBSearch(arr, target, compareFn, startIdx, endIdx){
  if(startIdx < 0 || endIdx < 0){
    throw new Error('[bSearch]Invalid index arguments!given: s=>' + startIdx + ', e=>' + endIdx);
  }
  if(startIdx > endIdx) return -1;
  var midIdx = Math.floor((endIdx - startIdx)/2) + startIdx,
      startComResult, midComResult, endComResult, resultIdx = -1;
  startComResult = compareFn(target, arr[startIdx]);
  endComResult = compareFn(target, arr[endIdx]);
  resultIdx = startComResult === 0 ? startIdx:
        endComResult === 0 ? endIdx : -1;
  if(resultIdx === -1){
    if(startIdx === endIdx || midIdx === startIdx){ return resultIdx; }
    midComResult = compareFn(target, arr[midIdx]);
    if(midComResult === 0){
      resultIdx = midIdx;
    }else if(midComResult < 0){
      resultIdx = _rBSearch(arr, target, compareFn, startIdx + 1, midIdx - 1);
    }else if(midComResult > 0){
      resultIdx = _rBSearch(arr, target, compareFn, midIdx + 1, endIdx - 1);
    }
  }
  return resultIdx;
}

module.exports = {
  classNames: classNames,
  bSearch: bSearch
};