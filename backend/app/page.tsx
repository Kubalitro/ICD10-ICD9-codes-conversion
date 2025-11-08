export default function Home() {
  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '40px 20px',
      lineHeight: '1.6'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🏥 ICD Codes API</h1>
      <p style={{ color: '#666', fontSize: '1.2rem', marginBottom: '40px' }}>
        API REST para conversión de códigos ICD-10 ↔ ICD-9 y clasificación de comorbilidades
      </p>

      <div style={{ 
        background: '#f5f5f5', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px',
        border: '1px solid #ddd'
      }}>
        <p style={{ margin: 0, fontSize: '1.1rem' }}>
          ✅ <strong>API Status:</strong> <span style={{ color: 'green' }}>Running</span>
        </p>
      </div>

      <h2 style={{ fontSize: '2rem', marginTop: '40px', marginBottom: '20px' }}>📚 Endpoints Disponibles</h2>

      <div style={{ display: 'grid', gap: '20px' }}>
        
        {/* Search Endpoint */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, color: '#0070f3' }}>1. Search - Buscar Códigos</h3>
          <code style={{ background: '#f0f0f0', padding: '8px 12px', borderRadius: '4px', display: 'block', marginBottom: '10px' }}>
            GET /api/search?code=E10.10
          </code>
          <p><strong>Parámetros:</strong></p>
          <ul>
            <li><code>code</code> (requerido): Código ICD a buscar</li>
            <li><code>type</code> (opcional): auto, icd10, o icd9</li>
            <li><code>fuzzy</code> (opcional): true para búsqueda por descripción</li>
          </ul>
          <a href="/api/search?code=E10.10" style={{ color: '#0070f3', textDecoration: 'none' }}>
            → Probar ejemplo: /api/search?code=E10.10
          </a>
        </div>

        {/* Convert Endpoint */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, color: '#0070f3' }}>2. Convert - Convertir Códigos</h3>
          <code style={{ background: '#f0f0f0', padding: '8px 12px', borderRadius: '4px', display: 'block', marginBottom: '10px' }}>
            GET /api/convert?code=E10.10&from=icd10&to=icd9
          </code>
          <p><strong>Parámetros:</strong></p>
          <ul>
            <li><code>code</code> (requerido): Código a convertir</li>
            <li><code>from</code> (requerido): icd10 o icd9</li>
            <li><code>to</code> (requerido): icd9 o icd10</li>
          </ul>
          <a href="/api/convert?code=E10.10&from=icd10&to=icd9" style={{ color: '#0070f3', textDecoration: 'none' }}>
            → Probar ejemplo: /api/convert?code=E10.10&from=icd10&to=icd9
          </a>
        </div>

        {/* Elixhauser Endpoint */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, color: '#0070f3' }}>3. Elixhauser - Clasificación de Comorbilidades</h3>
          <code style={{ background: '#f0f0f0', padding: '8px 12px', borderRadius: '4px', display: 'block', marginBottom: '10px' }}>
            GET /api/elixhauser?code=A1801
          </code>
          <p><strong>Parámetros:</strong></p>
          <ul>
            <li><code>code</code> (requerido): Código ICD-10</li>
          </ul>
          <p><strong>39 categorías disponibles:</strong> AUTOIMMUNE, CANCER_SOLID, DIAB_CX, HTN_CX, LIVER_MLD, etc.</p>
          <p><strong>4,664 códigos ICD-10</strong> clasificados</p>
          <a href="/api/elixhauser?code=A1801" style={{ color: '#0070f3', textDecoration: 'none' }}>
            → Probar ejemplo: /api/elixhauser?code=A1801 (Tuberculosis)
          </a>
        </div>

        {/* Charlson Endpoint */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, color: '#0070f3' }}>4. Charlson - Score de Comorbilidad</h3>
          <code style={{ background: '#f0f0f0', padding: '8px 12px', borderRadius: '4px', display: 'block', marginBottom: '10px' }}>
            GET /api/charlson?code=E10.10&system=icd10
          </code>
          <p><strong>Parámetros:</strong></p>
          <ul>
            <li><code>code</code> (requerido): Código ICD</li>
            <li><code>system</code> (opcional): icd10 (default) o icd9</li>
          </ul>
          <a href="/api/charlson?code=E10.10&system=icd10" style={{ color: '#0070f3', textDecoration: 'none' }}>
            → Probar ejemplo: /api/charlson?code=E10.10
          </a>
        </div>

        {/* Family Endpoint */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, color: '#0070f3' }}>5. Family - Códigos de Familia</h3>
          <code style={{ background: '#f0f0f0', padding: '8px 12px', borderRadius: '4px', display: 'block', marginBottom: '10px' }}>
            GET /api/family?prefix=E10&limit=10
          </code>
          <p><strong>Parámetros:</strong></p>
          <ul>
            <li><code>prefix</code> (requerido): Prefijo del código</li>
            <li><code>system</code> (opcional): icd10 (default) o icd9</li>
            <li><code>limit</code> (opcional): Máximo de resultados (default: 100)</li>
          </ul>
          <a href="/api/family?prefix=E10&limit=5" style={{ color: '#0070f3', textDecoration: 'none' }}>
            → Probar ejemplo: /api/family?prefix=E10&limit=5
          </a>
        </div>

      </div>

      <div style={{ 
        background: '#fffbea', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '40px',
        border: '1px solid #f0d87a'
      }}>
        <h3 style={{ marginTop: 0 }}>💡 Ejemplo de Uso</h3>
        <p>Usando JavaScript/Fetch:</p>
        <pre style={{ 
          background: '#282c34', 
          color: '#abb2bf', 
          padding: '15px', 
          borderRadius: '5px', 
          overflow: 'auto' 
        }}>
{`fetch('http://localhost:3000/api/search?code=E10.10')
  .then(res => res.json())
  .then(data => console.log(data));`}
        </pre>
      </div>

      <footer style={{ 
        marginTop: '60px', 
        paddingTop: '20px', 
        borderTop: '1px solid #ddd', 
        color: '#666',
        textAlign: 'center'
      }}>
        <p>
          📖 <a href="https://github.com/Atlas9266/ICD10-ICD9-codes-conversion" style={{ color: '#0070f3' }}>
            Documentación completa en GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
