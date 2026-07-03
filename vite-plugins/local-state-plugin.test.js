import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createStateMiddleware, DEFAULT_LOCAL_STATE } from './local-state-plugin'

function makeReq(method, body) {
  const req = { method }
  if (body !== undefined) {
    req[Symbol.asyncIterator] = async function* () {
      yield Buffer.from(JSON.stringify(body))
    }
  }
  return req
}

function makeRawReq(method, rawBody) {
  return {
    method,
    [Symbol.asyncIterator]: async function* () {
      yield Buffer.from(rawBody)
    },
  }
}

function makeRes() {
  const res = { statusCode: 200, headers: {}, body: null }
  res.setHeader = (key, value) => { res.headers[key] = value }
  res.end = (data) => { res.body = data }
  return res
}

describe('createStateMiddleware', () => {
  let tempDir, filePath

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'local-state-test-'))
    filePath = path.join(tempDir, 'local-state.json')
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('GET returns DEFAULT_LOCAL_STATE when the file does not exist yet', async () => {
    const handler = createStateMiddleware(filePath)
    const res = makeRes()

    await handler(makeReq('GET'), res)

    expect(res.statusCode).toBe(200)
    expect(JSON.parse(res.body)).toEqual(DEFAULT_LOCAL_STATE)
  })

  it('PUT writes the state to disk and echoes it back', async () => {
    const handler = createStateMiddleware(filePath)
    const newState = { reports: [{ id: '1', name: 'Jordan Lee' }], todos: [], priorityOverrides: {} }
    const res = makeRes()

    await handler(makeReq('PUT', newState), res)

    expect(JSON.parse(res.body)).toEqual(newState)
    const onDisk = JSON.parse(await fs.readFile(filePath, 'utf-8'))
    expect(onDisk).toEqual(newState)
  })

  it('GET reflects a previously written state, not the defaults', async () => {
    const handler = createStateMiddleware(filePath)
    const written = { reports: [], todos: [], priorityOverrides: { 'DIG-1': 5 } }

    await handler(makeReq('PUT', written), makeRes())
    const getRes = makeRes()
    await handler(makeReq('GET'), getRes)

    expect(JSON.parse(getRes.body)).toEqual(written)
  })

  it('an emptied todos array stays empty on the next GET rather than re-seeding DEFAULT_TODOS', async () => {
    const handler = createStateMiddleware(filePath)
    const emptied = { reports: [], todos: [], priorityOverrides: {} }

    await handler(makeReq('PUT', emptied), makeRes())
    const getRes = makeRes()
    await handler(makeReq('GET'), getRes)

    expect(JSON.parse(getRes.body).todos).toEqual([])
  })

  it('PUT with invalid JSON responds 400 without writing a file', async () => {
    const handler = createStateMiddleware(filePath)
    const res = makeRes()

    await handler(makeRawReq('PUT', 'not valid json'), res)

    expect(res.statusCode).toBe(400)
    await expect(fs.access(filePath)).rejects.toThrow()
  })

  it('rejects unsupported methods with 405', async () => {
    const handler = createStateMiddleware(filePath)
    const res = makeRes()

    await handler(makeReq('DELETE'), res)

    expect(res.statusCode).toBe(405)
  })

  it('creates the data directory if it does not exist yet', async () => {
    const nestedPath = path.join(tempDir, 'nested', 'local-state.json')
    const handler = createStateMiddleware(nestedPath)
    const state = { reports: [], todos: [], priorityOverrides: {} }

    await handler(makeReq('PUT', state), makeRes())

    const onDisk = JSON.parse(await fs.readFile(nestedPath, 'utf-8'))
    expect(onDisk).toEqual(state)
  })
})
