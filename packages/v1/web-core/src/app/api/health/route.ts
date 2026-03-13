import { NextResponse } from 'next/server';

/**
 * Health check endpoint
 *
 * @swagger
 * /api/health:
 *   get:
 *     tags: [Health]
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, service, timestamp]
 *               properties:
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'duckengine-web-core',
    timestamp: new Date().toISOString(),
  });
}
