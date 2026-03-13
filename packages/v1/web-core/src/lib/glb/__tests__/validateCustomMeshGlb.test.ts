import { assertCustomMeshGlbProfile, parseGlbJson } from '@/lib/glb/validateCustomMeshGlb';

function u32le(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}

function padTo4Bytes(buf: Buffer, padByte: number): Buffer {
  const pad = (4 - (buf.length % 4)) % 4;
  if (pad === 0) return buf;
  return Buffer.concat([buf, Buffer.alloc(pad, padByte)]);
}

function createGlb(json: any, binLength = 0): Buffer {
  const jsonBuf = padTo4Bytes(Buffer.from(JSON.stringify(json), 'utf8'), 0x20); // space padding
  const jsonChunkHeader = Buffer.concat([u32le(jsonBuf.length), u32le(0x4e4f534a)]); // JSON

  const chunks: Buffer[] = [jsonChunkHeader, jsonBuf];

  if (binLength > 0) {
    const binBuf = padTo4Bytes(Buffer.alloc(binLength, 0), 0x00);
    const binChunkHeader = Buffer.concat([u32le(binBuf.length), u32le(0x004e4942)]); // BIN\0
    chunks.push(binChunkHeader, binBuf);
  }

  const totalLength = 12 + chunks.reduce((sum, c) => sum + c.length, 0);
  const header = Buffer.concat([
    u32le(0x46546c67), // magic 'glTF'
    u32le(2),
    u32le(totalLength),
  ]);

  return Buffer.concat([header, ...chunks]);
}

function baseGltfJson(overrides?: Partial<any>): any {
  return {
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    // Minimal primitive with POSITION + TEXCOORD_0 so texture mapping is possible.
    // (The validator only checks JSON shape, not the binary buffer contents.)
    meshes: [{ primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1 } }] }],
    accessors: [
      { type: 'VEC3', componentType: 5126, count: 0 },
      { type: 'VEC2', componentType: 5126, count: 0 },
    ],
    buffers: [{ byteLength: 0 }],
    ...overrides,
  };
}

describe('customMesh GLB validation', () => {
  test('accepts valid single-mesh GLB (no textures/animations/skins)', () => {
    const glb = createGlb(baseGltfJson());
    expect(() => assertCustomMeshGlbProfile(glb)).not.toThrow();
  });

  test('rejects GLB with zero primitives', () => {
    const glb = createGlb(baseGltfJson({ meshes: [{ primitives: [] }] }));
    expect(() => assertCustomMeshGlbProfile(glb)).toThrow(/at least 1 primitive/i);
  });

  test('rejects GLB primitive missing TEXCOORD_0', () => {
    const glb = createGlb(
      baseGltfJson({
        meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
        accessors: [{ type: 'VEC3', componentType: 5126, count: 0 }],
      })
    );
    expect(() => assertCustomMeshGlbProfile(glb)).toThrow(/TEXCOORD_0/i);
  });

  test('rejects GLB with multiple meshes', () => {
    const glb = createGlb(baseGltfJson({ meshes: [{ primitives: [] }, { primitives: [] }] }));
    expect(() => assertCustomMeshGlbProfile(glb)).toThrow(/exactly 1 mesh/i);
  });

  test('rejects GLB with animations', () => {
    const glb = createGlb(baseGltfJson({ animations: [{}] }));
    expect(() => assertCustomMeshGlbProfile(glb)).toThrow(/must not contain animations/i);
  });

  test('rejects GLB with textures/images', () => {
    const glb = createGlb(baseGltfJson({ textures: [{}], images: [{}] }));
    expect(() => assertCustomMeshGlbProfile(glb)).toThrow(/textures\/images/i);
  });

  test('rejects GLB with skins', () => {
    const glb = createGlb(baseGltfJson({ skins: [{}] }));
    expect(() => assertCustomMeshGlbProfile(glb)).toThrow(/must not contain skins/i);
  });

  test('parseGlbJson rejects truncated/length-mismatch files', () => {
    const glb = createGlb(baseGltfJson());
    const corrupted = Buffer.from(glb);
    // Corrupt declared length
    corrupted.writeUInt32LE(corrupted.length + 4, 8);
    expect(() => parseGlbJson(corrupted)).toThrow(/length mismatch/i);
  });
});
