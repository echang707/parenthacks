import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import QuestionPage from './pages/QuestionPage'
import SubmitHackPage from './pages/SubmitHackPage'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/question/:id" element={<QuestionPage />} />
          <Route path="/submit" element={<SubmitHackPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Layout>
    </AuthProvider>
  )
}

export default App
