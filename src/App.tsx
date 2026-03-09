import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Compress from './pages/Compress'
import Convert from './pages/Convert'
import Panorama360 from './pages/Panorama360'
import LottiePreview from './pages/LottiePreview'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Compress />} />
        <Route path="/convert" element={<Convert />} />
        <Route path="/360" element={<Panorama360 />} />
        <Route path="/lottie" element={<LottiePreview />} />
      </Routes>
    </Layout>
  )
}

export default App
