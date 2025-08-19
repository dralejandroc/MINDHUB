// Simple daily stats API without complex dependencies
export async function GET() {
  const stats = {
    expectedIncome: 2500,
    advancePayments: 800,
    actualIncome: 1800,
    firstTimeConsultations: 3,
    followUpConsultations: 5,
    videoConsultations: 2,
    blockedSlots: 1,
    blockedReasons: ['Lunch break']
  };

  return new Response(JSON.stringify({
    success: true,
    data: stats,
    message: 'Daily stats retrieved successfully',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}