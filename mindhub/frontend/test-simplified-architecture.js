/**
 * TEST DE ARQUITECTURA SIMPLIFICADA
 * Verifica que la nueva arquitectura ultra-simple funciona correctamente
 */

async function testSimplifiedArchitecture() {
    console.log('🧪 TESTING SIMPLIFIED ARCHITECTURE');
    console.log('=====================================');
    
    // 1. Test de Auth con JWT simplificado
    console.log('1. Testing JWT authentication...');
    
    // Simular obtención de token desde localStorage o Supabase
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMWMxOTNlOS02NDNhLTRiYTktOTIxNC0yOTUzNmVhOTM5MTMiLCJlbWFpbCI6ImRyX2FsZWtzX2NAaG90bWFpbC5jb20ifQ.test';
    
    // 2. Test de Patient Creation con arquitectura simplificada
    console.log('2. Testing patient creation...');
    
    const testPatient = {
        first_name: 'Juan',
        paternal_last_name: 'Pérez',
        maternal_last_name: 'García',
        email: 'juan.perez@test.com',
        cell_phone: '+52 555 123 4567',
        birth_date: '1985-06-15',
        gender: 'male',
        age: 38
    };
    
    try {
        // Simular petición a la nueva arquitectura simplificada
        const response = await fetch('http://localhost:3001/api/expedix/patients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${mockToken}`
                // ✅ NOTA: Solo 2 headers - arquitectura simplificada!
                // ❌ Antes eran 8-10 headers (X-Workspace-ID, X-Tenant-Type, etc.)
            },
            body: JSON.stringify(testPatient)
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Patient creation SUCCESS:', result);
            console.log('📈 Simplified architecture working correctly!');
        } else {
            const error = await response.text();
            console.log('❌ Patient creation FAILED:', error);
            console.log('🔍 Need to debug simplified architecture');
        }
        
    } catch (error) {
        console.log('💥 Network error:', error.message);
    }
    
    // 3. Test de Patient Listing
    console.log('3. Testing patient listing...');
    
    try {
        const response = await fetch('http://localhost:3001/api/expedix/patients', {
            headers: {
                'Authorization': `Bearer ${mockToken}`
            }
        });
        
        console.log('📊 List response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Patient listing SUCCESS. Count:', result.total || result.data?.length);
        } else {
            console.log('❌ Patient listing FAILED');
        }
        
    } catch (error) {
        console.log('💥 List network error:', error.message);
    }
    
    console.log('=====================================');
    console.log('🏁 SIMPLIFIED ARCHITECTURE TEST COMPLETE');
}

// Ejecutar test si está en Node.js
if (typeof module !== 'undefined' && module.exports) {
    testSimplifiedArchitecture();
}

// Exportar para uso en browser
if (typeof window !== 'undefined') {
    window.testSimplifiedArchitecture = testSimplifiedArchitecture;
}