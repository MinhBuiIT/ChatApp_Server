import lodash from 'lodash';
export const pickInfoObject = (obj = {}, keys = []) => {
  return lodash.pick(obj, keys);
};
