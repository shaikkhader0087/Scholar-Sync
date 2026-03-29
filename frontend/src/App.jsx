import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { Hero } from "@/components/Hero"
import { Features } from "@/components/Features"
import { HowItWorks } from "@/components/HowItWorks"
import { CTA } from "@/components/CTA"
import { Footer } from "@/components/Footer"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { SummarizerPage } from "@/pages/SummarizerPage"
import { AdminDashboard } from "@/pages/AdminDashboard"

function LandingPage() {
  return (
    <Layout>
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/summarizer" element={
          <Layout>
            <SummarizerPage />
          </Layout>
        } />
        <Route path="/admin-dashboard" element={
          <Layout>
            <AdminDashboard />
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
