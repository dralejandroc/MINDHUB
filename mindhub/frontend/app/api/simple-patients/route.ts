// Ultra simple patients API at root level
export async function GET() {
  return Response.json({
    success: true,
    data: [
      {
        id: 'p1',
        first_name: 'Juan',
        paternal_last_name: 'Pérez'
      },
      {
        id: 'p2', 
        first_name: 'María',
        paternal_last_name: 'González'
      }
    ],
    message: 'Simple root API working'
  })
}