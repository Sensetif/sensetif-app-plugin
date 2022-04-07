import { AppPlugin, AppPluginMeta } from '@grafana/data';
import { SensetifAppSettings } from './types';
import { SensetifRootPage } from './SensetifRootPage';
import { ConfigPageBody } from 'config/ConfigPage';
import { getLimits } from './utils/api';

const appPlugin = new AppPlugin<SensetifAppSettings>();
appPlugin.setRootPage(SensetifRootPage);
appPlugin.addConfigPage({
  title: 'Setup',
  icon: 'list-ul',
  body: ConfigPageBody,
  id: 'setup',
});

const existingInitFn = appPlugin.init;
appPlugin.init = (meta: AppPluginMeta<SensetifAppSettings>) => {
  existingInitFn(meta);
  console.log('Test point 1');
  if (meta !== undefined) {
    let promise = getLimits();
    console.log('Test point 2');
    promise.then((limits) => {
      console.log('Test point 3');
      if (meta.jsonData === undefined) {
        console.log('Test point 4');
        meta.jsonData = {};
      }
      console.log('Test point 5');
      if (meta.jsonData.limits === undefined) {
        console.log('Test point 6');
        meta.jsonData.limits = limits;
        console.log('Test point 7');
      }
    });
  }
};
export const plugin = appPlugin;
