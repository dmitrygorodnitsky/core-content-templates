"""Offline regression tests: no network or Core mutations."""
import collections
import copy
import importlib.util
import pathlib
import unittest
import tempfile

spec = importlib.util.spec_from_file_location('native_payload', pathlib.Path(__file__).with_name('native-payload.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

class NativePayloadTests(unittest.TestCase):
    def test_sensor_links_use_codes_and_target_ids(self):
        resource={'id':90,'sensorDefinitions':[{'id':80,'code':'GEO'}]}
        definitions=[{'id':80,'code':'GEO','resourceType':{'id':90}}]
        m.validate_sensor_links([{'id':1,'code':'GEO'}],resource,definitions)
        with self.assertRaises(ValueError):m.validate_sensor_links([{'code':'GEO'}],resource,[{'id':80,'code':'GEO','resourceType':{'id':91}}])
        with self.assertRaises(ValueError):m.validate_sensor_links([{'code':'GEO'}],resource,definitions*2)
        with self.assertRaises(ValueError):m.validate_sensor_links([{'code':'GEO'}],{'id':90,'sensorDefinitions':[]},definitions)

    def test_script_without_category_preserves_null_in_payload(self):
        c=self.compiler()
        c.operations=[];c.field_coverage=[];c.permission_requirements=set();c.role_contracts={};c.pricekeys={}
        c.entries={'core/script|TEST':{'entity':'core/script','code':'TEST','targetCode':'TEST','targetOrganization':'SYSTEM','action':'create'}}
        c.defs={'core/script|TEST':{'source':{'code':'TEST','language':'Java','metadata':{},'executable':True,'category':None,'contentFile':'test.java'}}}
        with tempfile.TemporaryDirectory() as folder:
            c.package=pathlib.Path(folder);(c.package/'source-definitions').mkdir();(c.package/'source-definitions/test.java').write_text('class MAIN_CLASS {}')
            c.compile()
        script=next(o for o in c.operations if o['identity']['entity']=='core/script')
        self.assertIsNone(script['bodyTemplate']['entities'][0]['category'])

    def compiler(self):
        c = m.Compiler.__new__(m.Compiler)
        c.source = collections.defaultdict(dict)
        c.target = collections.defaultdict(list)
        c.entries = {}; c.lookups = {}; c.issues = []; c.current = 'fixture'
        c.renames = {'OLD_SCRIPT': 'NEW_SCRIPT'}
        c.rules = {'organizationAliases': {}, 'organizationMappings': {}, 'roleCodeMappings': {},
                   'urlTransformation': {'sourceOrigin': 'https://dev-1.servicewand.com', 'targetOrigin': 'https://prod.servicewand.com'}}
        return c

    def test_source_id_is_resolved_by_code_not_copied(self):
        c = self.compiler()
        c.source['core/unit']['26'] = {'id': 26, 'code': 'SQFT'}
        c.target['core/unit'] = [{'id': 901, 'code': 'SQFT'}]
        ref = c.reference('core/unit', 26)
        self.assertEqual(c.materialize(ref, set()), 901)

    def test_unknown_source_id_blocks(self):
        c = self.compiler(); ref = c.reference('core/unit', 26)
        waiting = set()
        self.assertIsNone(c.materialize(ref, waiting))
        self.assertTrue(waiting); self.assertTrue(c.issues)

    def test_ambiguous_code_blocks(self):
        c = self.compiler()
        c.target['core/unit'] = [{'id': 1, 'code': 'X'}, {'id': 2, 'code': 'X'}]
        ref = c.reference('core/unit', 'X')
        self.assertNotIn('targetId', c.lookups[ref['$ref']])
        self.assertIn('Ambiguous', c.issues[0]['reason'])

    def test_destination_owner_prevents_cross_organization_match(self):
        c = self.compiler()
        c.target['core-pim/product'] = [{'id': 1, 'code': 'PLAN', 'organization': {'code': 'B'}}]
        c.reference('core-pim/product', 'PLAN', owner='A')
        self.assertTrue(c.issues)

    def test_media_kinds_are_literals(self):
        c = self.compiler()
        values = c.attribute_defs([{'code': 'IMAGE', 'className': 'Media', 'entityTypes': [{'value': 'image'}]}])
        self.assertEqual(values[0]['entityTypes'][0]['value'], 'image')
        self.assertFalse(c.issues)

    def test_environment_projection_preserves_controls_and_path(self):
        c = self.compiler()
        original = {'URL': 'https://dev-1.servicewand.com/pages/{organization}/portal#/invoices', 'GUARD': True, 'ALLOW': ['test']}
        result = c.environment(original)
        self.assertEqual(result['URL'], 'https://prod.servicewand.com/pages/{organization}/portal#/invoices')
        self.assertTrue(result['GUARD']); self.assertEqual(result['ALLOW'], ['test'])
        self.assertTrue(original['URL'].startswith('https://dev-1.'))

    def test_price_matching_ignores_price_amount_but_preserves_dimensions(self):
        body = {'organization': {'id': 1}, 'product': {'id': 2}, 'type': {'id': 3},
                'attributes': {'4': {'UNIT_PRICE': {'value': 10}, 'CURRENCY': {'value': 9}, 'INTERVAL': {'value': 1, 'unit': 5}}}}
        row = copy.deepcopy(body); row['id'] = 123
        row['attributes']['4']['UNIT_PRICE']['value'] = 20
        self.assertEqual(m.match_price(body, [row])['id'], 123)
        other = copy.deepcopy(row); other['attributes']['4']['INTERVAL']['value'] = 12
        self.assertIsNone(m.match_price(body, [other]))
        other = copy.deepcopy(row); other['organization']['id'] = 99
        self.assertIsNone(m.match_price(body, [other]))
        with self.assertRaises(ValueError): m.match_price(body, [row, dict(row, id=456)])
        self.assertIsNone(m.match_price(body, []))

    def test_workflow_target_ids_and_event_identity_are_scoped(self):
        body={'states':[{'code':'A','events':[{'code':'GO','targets':[{'id':{'$state':'FLOW|B'}}]}]},{'code':'B','events':[]}], 'initialState':{'id':{'$state':'FLOW|A'}}}
        target={'states':[{'id':101,'code':'A','events':[{'id':201,'code':'GO'}]},{'id':102,'code':'B','events':[]}]}
        result=m.resolve_workflow_identity(body,target,True)
        self.assertEqual(result['states'][0]['id'],101)
        self.assertEqual(result['states'][0]['events'][0]['id'],201)
        self.assertEqual(result['states'][0]['events'][0]['targets'],[{'id':102}])
        self.assertEqual(result['initialState'],{'id':101})
        self.assertNotIn('id',body['states'][0])
        with self.assertRaises(ValueError):m.resolve_workflow_identity(body,None,True)
        target['states'].append({'id':103,'code':'EXTRA','events':[]})
        with self.assertRaises(ValueError):m.resolve_workflow_identity(body,target,True)

    def test_workflow_shell_can_create_without_source_ids(self):
        body={'states':[{'code':'A','attributes':[{'code':'X'}],'onEnter':'hook()'}]}
        self.assertEqual(m.resolve_workflow_identity(body,None,False),body)

    def test_nested_mapping_keeps_events_when_last_state_has_none(self):
        c=self.compiler()
        mappings=c.mappings({'states':[{'code':'A','events':[{'code':'GO','targets':[{'id':5}]}]},{'code':'B','events':[]}]})
        events=next(x for x in mappings[0]['mappings'] if x['name']=='events')
        self.assertEqual({x['name'] for x in events['mappings']},{'code','targets'})

    def test_operations_are_independent_snapshots(self):
        c=self.compiler();c.operations=[];c.entries={'fixture':{'targetOrganization':'SYSTEM'}}
        body={'states':[{'code':'A'}]};c.add('core/workflow','FLOW',body,35)
        body['states'][0]['events']=[{'code':'GO'}]
        self.assertNotIn('events',c.operations[0]['bodyTemplate']['entities'][0]['states'][0])

    def test_permission_patterns_are_anchored_and_exclusions_win(self):
        result,missing=m.expand_permissions(['A','DENY'],['WF:*'],['DENY','WF:SECRET'],['A','DENY','WF:GO','WF:SECRET','OTHER:WF:GO'])
        self.assertEqual(result,['A','WF:GO']);self.assertEqual(missing,[])
        self.assertEqual(m.expand_permissions(['MISSING'],[],[],[])[1],['MISSING'])

    def test_invalid_workflow_target_is_rejected(self):
        with self.assertRaises(ValueError):m.workflow_states({'initialState':'A','states':[{'code':'A'}],'events':[{'source':'A','code':'GO','targets':['MISSING']}]})

    def test_approved_relocation_reuses_existing_target_id(self):
        c=self.compiler();c.entries={'core/script|NEW_SCRIPT':{'entity':'core/script','targetCode':'NEW_SCRIPT','targetOrganization':'WINTER_SERVICES','prodOwner':'SYSTEM','action':'relocate-update'}}
        c.target['core/script']=[{'id':77,'code':'NEW_SCRIPT','organization':{'code':'SYSTEM'}}]
        self.assertEqual(c.materialize(c.reference('core/script','NEW_SCRIPT'),set()),77)
        self.assertFalse(c.issues)

if __name__ == '__main__': unittest.main()
