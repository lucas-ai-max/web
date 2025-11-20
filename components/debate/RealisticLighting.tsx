'use client';

export function RealisticLighting() {
  return (
    <>
      {/* Luz ambiente fria (das janelas da cidade) */}
      <ambientLight intensity={0.2} color="#7BA3C7" />
      
      {/* Luz principal de cima (luz do escritório) */}
      <spotLight
        position={[0, 8, 0]}
        angle={0.6}
        penumbra={1}
        intensity={0.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={20}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Luzes de preenchimento laterais (da cidade) */}
      <pointLight 
        position={[-10, 3, -5]} 
        intensity={0.1} 
        color="#4A90E2" 
      />
      <pointLight 
        position={[10, 3, -5]} 
        intensity={0.1} 
        color="#4A90E2" 
      />
      
      {/* Luz quente na mesa */}
      <spotLight
        position={[0, 5, 0]}
        angle={0.8}
        penumbra={1}
        intensity={0.3}
        color="#FFA94D"
      />

      {/* Luz de destaque frontal */}
      <directionalLight
        position={[0, 2, 5]}
        intensity={0.2}
        color="#FFFFFF"
      />
    </>
  );
}

