// Ultra simple consultations API at root level  
export async function GET() {
  return Response.json({
    success: true,
    data: [
      {
        id: 'c1',
        patient_id: 'p1',
        consultation_type: 'Initial'
      },
      {
        id: 'c2',
        patient_id: 'p2', 
        consultation_type: 'Follow-up'
      }
    ],
    message: 'Simple root consultations API working'
  })
}