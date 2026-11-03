/** Fasst die AX-Sonde kompakt zusammen: node summary.mjs <json> */
import fs from 'node:fs';
const file = process.argv[2];
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
for (const r of data) {
  console.log(`\n===== ${r.engine} ${r.browserVersion || ''}`);
  if (r.fatal) {
    console.log('FATAL:', r.fatal.split('\n').slice(0, 4).join(' | '));
    continue;
  }
  console.log('webAudio:', JSON.stringify(r.webAudio));
  const d = r.steps.initial.dom;
  console.log('slider min/max/step/value:', d.sliderMin, d.sliderMax, d.sliderStep, d.sliderValue, '| aria-valuetext:', d.sliderAriaValueText, '| describedby:', d.sliderAriaDescribedby);
  console.log('number:', d.numberValue, 'type', d.numberType, 'inputmode', d.numberInputmode);
  console.log('gain min/max/value:', d.gainMin, d.gainMax, d.gainValue, '| valuetext:', d.gainAriaValueText);
  console.log('status role/live:', d.statusRole, d.statusLive, '| error role/hidden:', d.errorRole, d.errorHidden);
  console.log('labels:', JSON.stringify(d.labels));
  const ax = r.steps.initial['#fqFreqRange'];
  console.log('AX slider:', JSON.stringify(ax && (ax.role ? { role: ax.role, name: ax.name, value: ax.value, properties: ax.properties } : ax.ariaSnapshot)));
  console.log('AX gauge:', JSON.stringify(r.steps.initial['#fqGainRange'] && (r.steps.initial['#fqGainRange'].role ? { role: r.steps.initial['#fqGainRange'].role, name: r.steps.initial['#fqGainRange'].name, value: r.steps.initial['#fqGainRange'].value, properties: r.steps.initial['#fqGainRange'].properties } : r.steps.initial['#fqGainRange'].ariaSnapshot)));
  console.log('afterPlay:', JSON.stringify({ status: r.steps.afterPlay.status, error: r.steps.afterPlay.error, hidden: r.steps.afterPlay.errorHidden, status_engine: r.steps.afterPlay.engineState && r.steps.afterPlay.engineState.status, leftRms: r.steps.afterPlay.leftRms }));
  console.log('afterStop:', JSON.stringify({ status: r.steps.afterStop.status, engine: r.steps.afterStop.engineState && r.steps.afterStop.engineState.status }));
  console.log('sliderKeys:', JSON.stringify(r.steps.sliderKeys.sliderValue), '-> number', JSON.stringify(r.steps.sliderKeys.numberValue), 'readout', JSON.stringify(r.steps.sliderKeys.readout), 'AXvalue', JSON.stringify(r.steps.sliderKeys.ax && r.steps.sliderKeys.ax.value));
  console.log('sweepStart status:', JSON.stringify(r.steps.sweepStart.status), 'progress:', JSON.stringify(r.steps.sweepStart.progress));
  console.log('sweepEnd status:', JSON.stringify(r.steps.sweepEnd.status));
  console.log('invalid:', JSON.stringify(r.steps.invalidNumber));
  console.log('hub badges:', r.steps.hub.badgeCount, JSON.stringify(r.steps.hub.badges), JSON.stringify(r.steps.hub.badgeColorOnly));
  console.log('console:', JSON.stringify(r.console));
  console.log('pageErrors:', JSON.stringify(r.pageErrors));
}
