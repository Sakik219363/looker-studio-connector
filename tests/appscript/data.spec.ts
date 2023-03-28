/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Clasp from '../utilities/clasp';
import getExpectedResponse from './getExpectedResponse';
import env from './env';

const DATE_TO_TEST = '2023-02-15';

// TODO: allow url to have index.php at the end

describe('data', () => {
  beforeAll(async () => {
    // TODO: assert credentials are valid in all tests
    await Clasp.run('setCredentials', {
      userToken: {
        username: env.APPSCRIPT_TEST_MATOMO,
        token: env.APPSCRIPT_TEST_TOKEN,
      },
    });
  });

  afterAll(async () => {
    await Clasp.run('clearEnvInTest');
  });

  describe('getSchema', () => {
    const methodsTested = {};
    global.ALL_REPORT_METADATA.forEach((r) => {
      const method = `${r.module}.${r.action}`; // TODO: must keep parameters as well
      if (methodsTested[method]) {
        return;
      }

      methodsTested[method] = true;

      if (process.env.ONLY_TEST_METHOD && process.env.ONLY_TEST_METHOD !== method) { // TODO: document
        return;
      }

      it(`should correctly map the schema for ${method}`, async () => {
        let result = await Clasp.run('getSchema', {
          configParams: {
            idsite: env.APPSCRIPT_TEST_IDSITE,
            report: method,
          },
        });
        expect(result).toEqual(getExpectedResponse(result, 'schema', `${method}`));
      });
    });
  });

  describe('getData', () => {
    it('should only include requested fields', async () => {
      let result = await Clasp.run('getData', {
        configParams: {
          idsite: env.APPSCRIPT_TEST_IDSITE,
          report: 'API.get',
          filter_limit: 5,
        },
        dateRange: {
          startDate: DATE_TO_TEST,
          endDate: DATE_TO_TEST,
        },
        fields: [
          { name: 'nb_visits' },
          { name: 'nb_conversions' },
          { name: 'PagePerformance_domprocessing_time' },
        ],
      });
      expect(result).toEqual(getExpectedResponse(result, 'data', 'API.get_withRequestedFields'));
    });

    it('should fail gracefully when no dateRange is specified', async () => {
      await expect(async () => {
        await Clasp.run('getData', {
          configParams: {
            idsite: env.APPSCRIPT_TEST_IDSITE,
            report: 'API.get',
            filter_limit: 5,
          },
        });
      }).rejects.toHaveProperty('message', 'Exception'); // actual data studio error message does not appear to be accessible
    });

    const methodsTested = {};
    global.ALL_REPORT_METADATA.forEach((r) => {
      const method = `${r.module}.${r.action}`;
      if (methodsTested[method]) {
        return;
      }

      methodsTested[method] = true;
      if (process.env.ONLY_TEST_METHOD && process.env.ONLY_TEST_METHOD !== method) { // TODO: document
        return;
      }

      it(`should correctly map the schema & data for ${method}`, async () => {
        let result = await Clasp.run('getData', {
          configParams: {
            idsite: env.APPSCRIPT_TEST_IDSITE,
            report: method,
            filter_limit: 5,
          },
          dateRange: {
            startDate: DATE_TO_TEST,
            endDate: DATE_TO_TEST,
          },
        });
        expect(result).toEqual(getExpectedResponse(result, 'data', `${method}`));
      });
    });
  });
});
