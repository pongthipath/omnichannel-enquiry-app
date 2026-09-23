import { SyncResult } from '../services/sync.service';
import { nextRetryDelayMs } from './backoff';
import { MemoryStore } from './memory-store';
import { SyncEngine } from './sync-engine';

const item = (clientId: string, body: string) => ({
  clientId,
  op: 'message.create' as const,
  payload: { conversationId: 'chat-1', body },
  createdAt: Date.now(),
});

describe('nextRetryDelayMs', () => {
  it('doubles from 5 วินาที และหยุดเพิ่มที่ 15 นาที', () => {
    const noJitter = () => 0;
    expect(nextRetryDelayMs(0, noJitter)).toBe(5_000);
    expect(nextRetryDelayMs(3, noJitter)).toBe(40_000);
    expect(nextRetryDelayMs(20, noJitter)).toBe(15 * 60_000);
  });

  it('เพิ่ม jitter ได้ไม่เกิน 20%', () => {
    expect(nextRetryDelayMs(0, () => 1)).toBe(6_000);
  });
});

describe('SyncEngine', () => {
  it('ส่งของที่ค้างตามลำดับที่เขียน แล้วล้างออกจากคิว', async () => {
    const store = new MemoryStore();
    await store.enqueue(item('a', 'หนึ่ง'));
    await store.enqueue(item('b', 'สอง'));
    const sent: string[][] = [];
    const engine = new SyncEngine(store, async (items) => {
      sent.push(items.map((i) => i.clientId));
      return items.map((i): SyncResult => ({ clientId: i.clientId, status: 'created', serverId: `s-${i.clientId}` }));
    });

    const outcome = await engine.run();

    expect(sent).toEqual([['a', 'b']]);
    expect(outcome).toMatchObject({ sent: 2, duplicates: 0, failed: 0 });
    expect(await store.countPending()).toBe(0);
  });

  it('enqueue ซ้ำด้วย clientId เดิมไม่เพิ่มรายการใหม่ (idempotency key)', async () => {
    const store = new MemoryStore();
    await store.enqueue(item('a', 'พิมพ์ครั้งเดียว'));
    await store.enqueue(item('a', 'กดซ้ำ'));
    expect(await store.countPending()).toBe(1);
  });

  it('ส่งไม่ผ่านทั้งก้อน (เน็ตหลุด) → กลับเข้าคิว รอ backoff', async () => {
    const store = new MemoryStore();
    await store.enqueue(item('a', 'ค้างไว้'));
    const now = 1_000_000;
    const engine = new SyncEngine(store, async () => {
      throw new Error('offline');
    }, () => now);

    const outcome = await engine.run();

    expect(outcome).toMatchObject({ sent: 0, failed: 1 });
    expect(await store.countPending()).toBe(1);
    expect(await store.due(now, 10)).toHaveLength(0); // ยังไม่ถึงเวลาลองใหม่
    expect(await store.due(now + 10_000, 10)).toHaveLength(1);
  });

  it('ของที่ server ปฏิเสธถาวร (4xx) ไม่ถูกส่งซ้ำ และรายงานกลับให้ผู้ใช้', async () => {
    const store = new MemoryStore();
    await store.enqueue(item('a', ''));
    await store.enqueue(item('b', 'ปกติ'));
    const engine = new SyncEngine(store, async (items) =>
      items.map((i): SyncResult =>
        i.clientId === 'a'
          ? { clientId: i.clientId, status: 'failed', error: 'common.validation', retryable: false }
          : { clientId: i.clientId, status: 'created', serverId: 's-b' },
      ),
    );

    const outcome = await engine.run();

    expect(outcome!.permanent.map((i) => i.clientId)).toEqual(['a']);
    expect(await store.due(Date.now() + 60 * 60_000, 10)).toHaveLength(0);
  });

  it('ข้อความที่ server เคยรับไปแล้ว นับเป็น duplicate ไม่ใช่ error', async () => {
    const store = new MemoryStore();
    await store.enqueue(item('a', 'ส่งไปแล้วแต่แอปไม่รู้'));
    const engine = new SyncEngine(store, async (items) =>
      items.map((i): SyncResult => ({ clientId: i.clientId, status: 'duplicate', serverId: 's-a' })),
    );

    const outcome = await engine.run();

    expect(outcome).toMatchObject({ sent: 0, duplicates: 1 });
    expect(await store.countPending()).toBe(0);
  });

  it('หลังแอปถูกปิดกลางคัน ของที่ค้างสถานะ SYNCING กลับมาส่งใหม่ได้', async () => {
    const store = new MemoryStore();
    await store.enqueue(item('a', 'ค้างกลางทาง'));
    await store.markSyncing(['a']);
    expect(await store.due(Date.now(), 10)).toHaveLength(0);

    await store.resetInterrupted();

    expect(await store.due(Date.now(), 10)).toHaveLength(1);
  });

  it('เรียก run ซ้อนกันไม่ส่งของซ้ำ', async () => {
    const store = new MemoryStore();
    await store.enqueue(item('a', 'หนึ่ง'));
    let calls = 0;
    const engine = new SyncEngine(store, async (items) => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 10));
      return items.map((i): SyncResult => ({ clientId: i.clientId, status: 'created', serverId: 's' }));
    });

    const [first, second] = await Promise.all([engine.run(), engine.run()]);

    expect(calls).toBe(1);
    expect(second ?? first).toBeTruthy(); // การเรียกที่สองได้ null เพราะมีรอบที่กำลังวิ่งอยู่
  });
});
