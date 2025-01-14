/**
 * @jest-environment jsdom
 * @see https://github.com/mswjs/interceptors/issues/308
 */
import { HttpServer } from '@open-draft/test-server/http'
import zlib from 'zlib'
import { XMLHttpRequestInterceptor } from '../../../../src/interceptors/XMLHttpRequest'
import { createXMLHttpRequest } from '../../../helpers'

const httpServer = new HttpServer((app) => {
  app.get('/compressed', (_req, res) => {
    res
      .status(200)
      .set('Content-Encoding', 'gzip')
      .send(zlib.gzipSync(Buffer.from('compressed-body')))
  })
})

const interceptor = new XMLHttpRequestInterceptor()

beforeAll(async () => {
  interceptor.apply()
  await httpServer.listen()
})

afterAll(async () => {
  interceptor.dispose()
  await httpServer.close()
})

test('bypasses a compressed HTTP request', async () => {
  const request = await createXMLHttpRequest((request) => {
    request.open('GET', httpServer.http.url('/compressed'))
    request.send()
  })

  expect(request.status).toEqual(200)
  expect(request.response).toEqual('compressed-body')
  expect(request.responseText).toBe('compressed-body')
})
