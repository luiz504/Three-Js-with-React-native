import React, { useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Canvas, useRender } from './react-three-fiber';


window.performance = {
  clearMarks() {},
  measure() {},
  clearMeasures() {},
  mark() {},
}

function Box() {
  const box = useRef()
  const [color, setColor] = useState(0xff0000);

  useRender(() => {
    if (box.current) {
      box.current.rotation.x += 0.01
      box.current.rotation.y += 0.02
    }
  })

  const onPointerDown = () => setColor(0x00ffff)
  const onPointerUp = () => setColor(0xff0000)
  
  return (
    <mesh castShadow receiveShadow ref={box} onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerOut={onPointerUp}>
      <boxBufferGeometry attach="geometry" args={[1, 1, 1]} />
      <meshStandardMaterial attach="material" color={color} />
    </mesh>
  )
}

export default function App() {
  return (
    <View style={styles.container}>
      <Canvas>
        <ambientLight intensity={1} />
        <spotLight intensity={0.6} position={[30, 30, 50]} angle={0.2} penumbra={1} castShadow />
        <Box />
      </Canvas>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
})