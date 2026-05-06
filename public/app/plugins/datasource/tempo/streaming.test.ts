import { lastValueFrom, of } from 'rxjs';

import {
  dateTime,
  LiveChannelConnectionState,
  type LiveChannelEvent,
  LiveChannelEventType,
  type DataQueryRequest,
  type DataSourceInstanceSettings,
} from '@grafana/data';
import { getGrafanaLiveSrv } from '@grafana/runtime';

import { type TempoDatasource } from './datasource';
import { doTempoSearchStreaming } from './streaming';
import { type TempoJsonData, type TempoQuery } from './types';

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  getGrafanaLiveSrv: jest.fn(),
}));

describe('Tempo streaming', () => {
  it('surfaces Live channel status errors from search streaming', async () => {
    const liveStatusError: LiveChannelEvent = {
      type: LiveChannelEventType.Status,
      id: 'ds/gdev-tempo/search/test',
      timestamp: Date.now(),
      state: LiveChannelConnectionState.Disconnected,
      error: { code: 110, message: 'expired' },
    };

    jest.mocked(getGrafanaLiveSrv).mockReturnValue({
      getStream: jest.fn().mockReturnValue(of(liveStatusError)),
    } as unknown as ReturnType<typeof getGrafanaLiveSrv>);

    await expect(
      lastValueFrom(
        doTempoSearchStreaming(
          { refId: 'A', query: '{}', queryType: 'traceql', filters: [] },
          { uid: 'gdev-tempo' } as TempoDatasource,
          {
            range: {
              from: dateTime('2026-05-06T10:00:00Z'),
              to: dateTime('2026-05-06T11:00:00Z'),
              raw: { from: 'now-1h', to: 'now' },
            },
          } as DataQueryRequest<TempoQuery>,
          {} as DataSourceInstanceSettings<TempoJsonData>
        )
      )
    ).rejects.toThrow('expired');
  });
});
