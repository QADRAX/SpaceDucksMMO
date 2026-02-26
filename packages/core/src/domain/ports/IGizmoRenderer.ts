export interface IGizmoRenderer {
    drawLine(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, color?: string): void;
    drawSphere(x: number, y: number, z: number, radius: number, color?: string): void;
    drawBox(x: number, y: number, z: number, w: number, h: number, d: number, color?: string): void;
    drawLabel(text: string, x: number, y: number, z: number, color?: string): void;
    drawGrid(size: number, divisions: number, color?: string): void;
    drawFrustum(fov: number, aspect: number, near: number, far: number, x: number, y: number, z: number, rotationX: number, rotationY: number, rotationZ: number, color?: string): void;
    clear(): void;
}
