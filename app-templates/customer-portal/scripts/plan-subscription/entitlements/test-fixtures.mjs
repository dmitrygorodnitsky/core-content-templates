import { loadConfig } from './prepare.mjs';
const config = await loadConfig();

export function catalogFixture() {
  let id = 100;
  const product = (code, values, type = 'SERVICEWAND_SAAS') => ({ id: id++, code,
    organization: { code: 'SERVICEWAND' }, type: { code: type },
    attributes: { source: Object.fromEntries(Object.entries(values).map(([name, value]) => [name, { value }])) } });
  const addons = config.addons.siteExpansion.productCodes.map((code, index) => product(code,
    { COUNT: index === 0 ? 50 : 100 }, 'SERVICEWAND_SAAS_PROPERTY_EXT'));
  const weather = product(config.addons.weather.productCode, { ENABLED: true }, 'SERVICEWAND_SAAS_WEATHER_EXT');
  const plans = config.plans.productCodes.map((code, index) => product(code, {
    ...Object.fromEntries(config.booleanFeatures.map(rule => [rule.attribute,
      rule.decoder === 'LOCALIZED_BOOLEAN' ? { en: { NAME: 'true' } } : true])),
    CASE_MANAGEMENT: ['false', 'Standard', 'Configurable'][index],
    OPERATIONAL_DASHBOARDS: ['false', 'Standard', 'Configurable'][index],
    OPERATIONAL_REASSIGNMENT: index === 0 ? 'Individual reassignment' : 'Individual and bulk reassignment',
    ACTIVE_PROPERTIES_INCLUDED: ['50', '200', '500'][index],
    COMPATIBILITY: [addons[index].id, weather.id],
  }));
  return { products: [...plans, ...addons, weather], definitions: [], types: [{
    code: 'SERVICEWAND_SAAS', attributes: [
      ...config.booleanFeatures.map(rule => ({ code: rule.attribute,
        className: rule.decoder === 'LOCALIZED_BOOLEAN'
          ? 'com.pixelnation.spring.domain.LocalizationMessage' : 'java.lang.Boolean' })),
      ...config.levels.map(rule => ({ code: rule.attribute, className: 'java.lang.String' })),
    ],
  }] };
}
